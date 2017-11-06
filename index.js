'use strict'

const _ = require('lodash');
const got = require('got');
var yahooFinance = require('yahoo-finance');

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

          stockList += data[0].symbol;
        
        res.remove('loading');

        yahooFinance.quote({
          symbol: stockList,
          modules: ['price', 'summaryDetail']       // optional; default modules.
        }, function(err, quote) {
          //console.log(quote);
          let quotes = JSON.parse(quote.price);
          if(quotes.regularMarketChangePercent>0){
            return {
              id: stockList,
              payload: 'open',
              title: quotes.longName + ' <span style="font-size:0.7em;"><b> (' + stockList + ') </b></span> - $' + parseFloat(quotes.regularMarketPrice).toFixed(2) + ' <span style="border-radius:5px;padding:3px;color:white;font-size:0.7em;background-color:green">+ ' + parseFloat(quotes.regularMarketChangePercent).toFixed(2) + '%</span>',
              desc: "Current stock prices for " + quotes.longName,
              icon: "# fa fa-arrow-up"
            };
          }
          else{
            return {
              id: stockList,
              payload: 'open',
              title: x.resource.fields.name + ' <span style="font-size:0.7em;"><b> (' + stockList + ') </b></span> - $' + parseFloat(quotes.regularMarketPrice).toFixed(2) + ' <span style="border-radius:5px;padding:3px;color:white;font-size:0.7em;background-color:red"> ' + parseFloat(quotes.regularMarketChangePercent).toFixed(2) + '%</span>',
              desc: "Current stock prices for " + quotes.longName,
              icon: "# fa fa-arrow-down"
            };
          }
          res.add(quotes);
        });
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
