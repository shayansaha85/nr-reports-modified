'use strict'

const fs = require('fs'),
  { createLogger, logTrace } = require('../logger'),
  {
    getOption,
    isUndefined,
    toBoolean,
    toNumber,
    withTempFile,
    trimStringAndLower,
    getEnvNs,
  } = require('../util'),
  {
    EMAIL_FROM_VAR,
    EMAIL_TO_VAR,
    EMAIL_CC_VAR,
    EMAIL_SUBJECT_VAR,
    EMAIL_TEMPLATE_VAR,
    EMAIL_TEMPLATE_NAME_KEY,
    EMAIL_TEMPLATE_KEY,
    EMAIL_ATTACHMENTS_TEMPLATE_DEFAULT,
    EMAIL_TEMPLATE_DEFAULT,
  } = require('../constants'),
  { FileOutput } = require('../output'),
  { renderTemplate } = require('../template-engines'),
  { Client } = require('@microsoft/microsoft-graph-client'),
  { GraphAuthProvider } = require('@microsoft/graph-client-auth')

const logger = createLogger('email')

function createGraphClient() {
  const clientId = process.env.MS_GRAPH_CLIENT_ID
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET
  const tenantId = process.env.MS_GRAPH_TENANT_ID

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Missing Microsoft Graph credentials')
  }

  const authProvider = new GraphAuthProvider({
    clientId,
    clientSecret,
    tenantId,
  })

  return Client.initWithMiddleware({ authProvider })
}

async function renderEmailTemplate(
  context,
  report,
  channelConfig,
  defaultTemplate = null,
) {
  const emailTemplate = getOption(channelConfig, EMAIL_TEMPLATE_KEY)

  if (emailTemplate) {
    return await renderTemplate(context, report, null, emailTemplate)
  }

  const emailTemplateName = getOption(
    channelConfig,
    EMAIL_TEMPLATE_NAME_KEY,
    EMAIL_TEMPLATE_VAR,
    defaultTemplate,
  )

  return await renderTemplate(
    context,
    report,
    emailTemplateName,
  )
}

async function makeMessage(context, report) {
  const message = {
    from: { emailAddress: { address: context.get(EMAIL_FROM_KEY, EMAIL_FROM_VAR) } },
    toRecipients: [{ emailAddress: { address: context.get(EMAIL_TO_KEY, EMAIL_TO_VAR) } }],
    ccRecipients: context.get(EMAIL_CC_KEY, EMAIL_CC_VAR)?.split(',').map(email => ({ emailAddress: { address: email.trim() } })) || [],
    subject: await renderTemplate(
      context,
      report,
      null,
      context.get(EMAIL_SUBJECT_KEY, EMAIL_SUBJECT_VAR, ''),
    ),
  }

  return message
}

async function send(context, message) {
  const client = createGraphClient()
  logTrace(logger, log => {
    log({ ...message, from: '[REDACTED]', toRecipients: '[REDACTED]' }, 'Message:')
  })

  await client.api('/me/sendMail').post({ message })
}

async function sendMailWithBody(
  context,
  channelConfig,
  message,
  body,
) {
  const format = trimStringAndLower(
    channelConfig.format,
    'html',
  )

  if (format === 'html') {
    message.body = { contentType: 'HTML', content: body }
  } else if (format === 'text') {
    message.body = { contentType: 'TEXT', content: body }
  } else {
    throw new Error(`Invalid format ${format}`)
  }

  await send(context, message)
}

async function sendMailWithAttachments(
  context,
  report,
  channelConfig,
  output,
  message,
) {
  const attachments = await Promise.all(output.files.map(async file => ({
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: file,
    contentBytes: (await fs.promises.readFile(file)).toString('base64')
  })))

  message.attachments = attachments

  const body = await renderEmailTemplate(
    context,
    report,
    channelConfig,
    EMAIL_ATTACHMENTS_TEMPLATE_DEFAULT,
  )

  await sendMailWithBody(context, channelConfig, message, body)
}

async function renderOutputAndSendMailWithAttachments(
  context,
  report,
  channelConfig,
  output,
  message,
  tempDir,
) {
  await withTempFile(async tempFile => {
    await fs.promises.writeFile(
      tempFile,
      await output.render(
        context,
        report,
        channelConfig,
      ),
    )

    await sendMailWithAttachments(
      context,
      report,
      channelConfig,
      new FileOutput([tempFile]),
      message,
    )
  }, tempDir, output.getOutputFileName(context, report))
}

async function sendMail(
  context,
  report,
  channelConfig,
  output,
  message,
  tempDir,
) {
  if (channelConfig.attachOutput) {
    await renderOutputAndSendMailWithAttachments(
      context,
      report,
      channelConfig,
      output,
      message,
      tempDir,
    )
    return
  }

  const text = await output.render(
    context,
    report,
    channelConfig,
  )

  await sendMailWithBody(
    context,
    channelConfig,
    message,
    channelConfig.passThrough ? text : (
      await renderEmailTemplate(
        context.context({ result: text }),
        report,
        channelConfig,
        EMAIL_TEMPLATE_DEFAULT,
      )
    ),
  )
}

async function sendEmail(
  context,
  manifest,
  report,
  publishConfig,
  channelConfig,
  output,
  tempDir,
) {
  const message = await makeMessage(context, report)

  if (output.isFile()) {
    await sendMailWithAttachments(
      context,
      report,
      channelConfig,
      output,
      message,
    )
    return
  }

  await sendMail(
    context,
    report,
    channelConfig,
    output,
    message,
    tempDir,
  )
}

module.exports = {
  publish: sendEmail,
  getChannelDefaults: () => ({}),
}
