"use strict";
var _ = require('lodash');
var async = require('async');
var render = require('./render');

/**
 * [partial description]
 * @param  {[type]} res     [description]
 * @param  {[type]} options
 * {
 *   //不需要与数据库获取数据，用于render整个html的大框架
 *   main : {
 *     view : '对应的view',
 *     // 用于main.view的render，数据不支持异步获取
 *     data : {
 *     }
 *   },
 *   partial : {
 *     // templateId是该partial在main中填充区域的id
 *     'templateId1' : {
 *       view : '对应的view',
 *       // 该partial的数据获取，也可以直接使用Object
 *       data : function(err, data){
 *       
 *       }
 *     },
 *     'templateId12' : {
 *       view : '对应的view',
 *       data : {
 *         name : 'test',
 *         title : 'title'
 *       }
 *     }
 *   }
 * }
 * @param  {[type]} cbf     [description]
 * @return {[type]}         [description]
 */
module.exports = function(res, options, cbf){
  var err = render.checkOptions(options);
  if(err){
    cbf(err);
    return;
  }
  var main = options.main;
  var finished = false;
  var partial = options.partial;
  var partialResHtml = null;
  // 首先render大框架部分
  res.render(main.view, main.data, function(err, html){
    if(err){
      finished = true;
      cbf(err);
      return;
    }
    if(partial){
      partialResHtml = html;
    }else{
      res.send(html);
    }
  });
  //如果没有partial属性，证明不需要做分块处理，直接返回
  if(!partial){
    return;
  }

  // 分块内容的替换
  var partialAppend = function(id, html){
    if(finished){
      return;
    }
    var reg = new RegExp('<div id="' + id  + '"[\\s\\S]*?></div>');
    var result = reg.exec(partialResHtml);
    if(result[0]){
      result = result[0];
      partialResHtml = partialResHtml.replace(result, result.substring(0, result.length - 6) + html + '</div>');
    }
  };

  var fnOptionList = render.getPartialHandlers(res, partial);
  async.each(fnOptionList, function(fnOption, cbf){
    var fn = fnOption.handler;
    var id = fnOption.id;
    fn(function(err, html){
      if(err){
        partialAppend(id, err.message);
      }else{
        partialAppend(id, html);
      }
      cbf();
    });
  }, function(){
    if(!finished){
      res.send(partialResHtml);
    }
    finished = true;
    cbf();
  });
};