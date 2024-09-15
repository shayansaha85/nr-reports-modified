'use strict'

const { getOption, buildCsv } = require('../util'),
  { renderTemplate } = require('../template-engines'),
  {
    FILE_TEMPLATE_NAME_KEY,
    FILE_TEMPLATE_VAR,
    QUERY_RESULTS_FORMAT_KEY,
    QUERY_RESULTS_FORMAT_VAR,
    QUERY_RESULTS_FORMAT_DEFAULT,
    QUERY_RESULTS_FORMAT_JSON,
  } = require('../constants')

async function render(
  context,
  report,
  channelConfig,
  output,
) {
  const template = getOption(
    channelConfig,
    FILE_TEMPLATE_NAME_KEY,
    FILE_TEMPLATE_VAR,
  )

  /*
   * If no template was specified, return the unprocessed raw data or
   * build a CSV.
   */
  if (!template) {
    const { columns, rows } = output.data

    /*
     * If the output does not contain `columns` and `rows` properties, then
     * the query generator passed the raw graphql through. If there is no
     * template (which is a weird case), all we can do is turn the graphql
     * response into JSON.
     */
    if (!columns && !rows) {
      return JSON.stringify(output.data)
    }

    /*
     * Columns and rows were set by the query generator. Use the resultsFormat
     * channel configuration parameter to determine what to generate.
     */

    const resultsFormat = getOption(
      channelConfig,
      QUERY_RESULTS_FORMAT_KEY,
      QUERY_RESULTS_FORMAT_VAR,
      QUERY_RESULTS_FORMAT_DEFAULT,
    )

    if (resultsFormat.toLowerCase() === QUERY_RESULTS_FORMAT_JSON) {
      return JSON.stringify(
        output.data.rows.map(row => (
          output.data.columns.reduce((accum, col) => {
            accum[col] = row[col] ? row[col] : null
            return accum
          }, {})
        )),
      )
    }

    return buildCsv(output.data.columns, output.data.rows)
  }

  /*
   * Otherwise, render the template with the output data. The data could be
   * either the processed columns and rows or an array of the raw GraphQL
   * results (if passThrough was specified on the query).
   *
   * TODO: This would re-render the template for every channel which calls
   * output.render() for a given report.
   */
  return await renderTemplate(
    context.context({ result: output.data }),
    report,
    template,
  )
}

module.exports = render
