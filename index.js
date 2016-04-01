'use strict'

const _ = require('lodash');
const got = require('got');

module.exports = (pluginContext) => {
  const shell = pluginContext.shell
  const logger = pluginContext.logger;

  function search(query, res) {
    const query_trim = query.trim()

    if (query_trim.length === 0) {
      return
    }

    res.add({
      id: 'loading',
      title: 'fetching...',
      desc: 'data from Yahoo Finance.',
      icon: '#fa fa-circle-o-notch fa-spin'
    });

    let autoc = 'https://s.yimg.com/aq/autoc?query=' + query_trim + '&region=US&lang=en-US';
    let stockList = '';
    let results = true;

    got(autoc)
      .then(response => {
        let list = JSON.parse(response.body);
        let data = list.ResultSet.Result;
        for (var i = 0; i < data.length; i++) {
          stockList += data[i].symbol +',';
        }
        stockList = stockList.slice(0, -1);
        let lookup = 'https://finance.yahoo.com/webservice/v1/symbols/' + stockList + '/quote?format=json&view=detail';

        res.remove('loading');

        got(lookup)
          .then(response => {
            let quotes = JSON.parse(response.body);
            quotes = quotes.list.resources;
            quotes = _.take(quotes, 6).map((x) => {
              if (x.resource.fields.chg_percent > 0) {
                return {
                  id: x.resource.fields.symbol,
                  payload: 'open',
                  title: x.resource.fields.name + ' <span style="font-size:0.7em;"><b> (' + x.resource.fields.symbol + ') </b></span> - $' + parseFloat(x.resource.fields.price).toFixed(2) + ' <span style="border-radius:5px;padding:3px;color:white;font-size:0.7em;background-color:green">+ ' + parseFloat(x.resource.fields.chg_percent).toFixed(2) + '%</span>',
                  desc: "Current stock prices for " + x.resource.fields.name,
                  icon: "# fa fa-arrow-up"
                };
              } else {
                return {
                  id: x.resource.fields.symbol,
                  payload: 'open',
                  title: x.resource.fields.name + ' <span style="font-size:0.7em;"><b> (' + x.resource.fields.symbol + ') </b></span> - $' + parseFloat(x.resource.fields.price).toFixed(2) + ' <span style="border-radius:5px;padding:3px;color:white;font-size:0.7em;background-color:red"> ' + parseFloat(x.resource.fields.chg_percent).toFixed(2) + '%</span>',
                  desc: "Current stock prices for " + x.resource.fields.name,
                  icon: "# fa fa-arrow-down"
                };
              }
            });
            res.add(quotes);
          })
      })
  }

  function execute(id, payload) {
    if (payload !== 'open') {
      return;
    } else {
      shell.openExternal(`https://finance.yahoo.com/q?s=${id}`);
      return;
    }
  }

  return {
    search,
    execute
  }
}
