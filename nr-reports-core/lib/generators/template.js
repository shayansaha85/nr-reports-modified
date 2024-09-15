'use strict';

const fs = require('fs'); // Add this line to import the fs module
const path = require('path');
const { shouldRender } = require('../util');
const {
  Output,
  getDefaultOutputFileName,
  FileOutput,
} = require('../output');
const { createLogger, logTrace } = require('../logger');
const {
  init: initEngines,
  processTemplate,
  getTemplateEngine,
} = require('../template-engines');

const logger = createLogger('template-generator');

function init(context) {
  initEngines(context);
}

function maybeConvertMarkdown(context, report, content) {
  const { templateName } = report;
  const isMarkdown = typeof report.isMarkdown === 'undefined' ? (
    path.extname(templateName.toLowerCase()) === '.md'
  ) : report.isMarkdown;

  logger.trace(`Template ${isMarkdown ? 'is' : 'is not'} markdown.`);

  return isMarkdown ? (
    getTemplateEngine(context).markdownToHtml(content)
  ) : content;
}

async function renderHtml(context, report, content, tempDir) {
  const html = maybeConvertMarkdown(context, report, content);
  const file = path.join(
    tempDir,
    getDefaultOutputFileName(report, 'html')
  );

  logger.trace('Saving HTML content to file...');

  await fs.promises.writeFile(file, html, 'utf8'); // Use fs.promises to write the file

  return new FileOutput([file]);
}

async function generateTemplateReport(context, manifest, report, tempDir) {
  try {
    const content = await processTemplate(context, manifest, report);

    if (shouldRender(report)) {
      return await renderHtml(context, report, content, tempDir);
    }

    return new Output(content);
  } catch (err) {
    logger.error(err);
  }

  return null;
}

module.exports = {
  init,
  generate: generateTemplateReport,
};
