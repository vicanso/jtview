"use strict";
var _ = require('lodash');
var async = require('async');

/**
 * [checkOptions description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
exports.checkOptions = function(options){
  if(!options){
    return new Error('options is null');
  }
  if(!options.main){
   return new Error('options.main in null');
  }
};


// render部分的html
var renderPartical = function(res, options, cbf){
  var id = options.id;
  delete options.id;
  res.render(options.view, options.data, cbf);
};


exports.getPartialHandlers = function(res, partialConfigs){
  var fnList = _.map(partialConfigs, function(config, id){
    var handler = function(cbf){
      var options = {
        view : config.view
      };
      var fn = config.data;
      // 判断获取数据的是否function，如果为function则表示数据为异步回调
      if(_.isFunction(fn)){
        fn(function(err, data){
          if(err){
            cbf(err);
          }else{
            options.data = data;
            renderPartical(res, options, cbf);
          }
        });
      }else{
        options.data = config.data;
        GLOBAL.setImmediate(function(){
          renderPartical(res, options, cbf);
        });
      }
    };
    return {
      id : config.id || id,
      handler : handler
    };
  });
  return fnList;
};

