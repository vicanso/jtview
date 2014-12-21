"use strict";
var _ = require('lodash');
var async = require('async');

/**
 * [checkOptions description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
var checkOptions = function(options){
  if(!options){
    return new Error('options is null');
  }
  if(!options.main){
   return new Error('options.main in null');
  }
};



var render = function(res, options, type, cbf){
  var err = checkOptions(options);
  if(err){
    cbf(err);
    return;
  }
  var main = options.main;
  var finished = false;
  var partial = options.partial;
  var partialResHtml = null;
  res.render(main.view, main.data, function(err, html){
    if(err){
      finished = true;
      cbf(err);
      return;
    }
    
    if(partial){
      //如果存在partial， 生成非闭合的html
      if(type === 'bigPipe'){
        html = html.replace('</html>', '');
        res.write(html);
      }else{
        partialResHtml = html;
      }
    }else{
      res.send(html);
    }
  });

  if(!partial){
    return;
  }

  //生成script，将html插入到对应的id中
  var bigPipeAppend = function(id, html){
    if(finished){
      return;
    }
    res.write('<script>' +
      'document.getElementById("' + id + '").innerHTML= "' + html + '";' +
    '</script>');
  };

  var partialAppend = function(id, html){
    if(finished){
      return;
    }
    partialResHtml = partialResHtml.replace('<div id="' + id  + '"></div>', html);
  };


  // render部分的html
  var renderPartical = function(renderOptions, cbf){
    res.render(renderOptions.view, renderOptions.data, function(err, html){
      if(err){
        //如果出错，显示生成模板失败
        console.error(err);
        console.error(err.stack);
        html = '生成模板失败！';
      }
      if(type === 'bigPipe'){
        bigPipeAppend(renderOptions.id, html);
      }else{
        partialAppend(renderOptions.id, html);
      }
      cbf(null);
    });
  };



  var fnList = _.map(partial, function(config, id){
    return function(cbf){
      var renderOptions = {
        id : config.id || id,
        view : config.view
      };
      var fn = config.data;
      // 判断获取数据的是否function，如果为function则表示数据为异步回调
      if(_.isFunction(fn)){
        fn(function(err, data){
          if(err){
            console.error(err);
            console.error(err.stack);
            // 如果获取数据出错，显示出错信息
            var html = '获取数据失败';
            if(type === 'bigPipe'){
              bigPipeAppend(id, html);
            }else{
              partialAppend(id, html);
            }
            
            cbf(null);
          }else{
            renderOptions.data = data;
            renderPartical(renderOptions, cbf);
          }
        });
      }else{
        GLOBAL.setImmediate(function(){
          renderOptions.data = config.data;
          renderPartical(renderOptions, cbf);
        });
        
      }
    };
  });
  async.parallel(fnList, function(err){
    if(!finished){
      if(type === 'bigPipe'){
        res.end('</html>');
      }else{
        res.send(partialResHtml);
      }
    }
    finished = true;
    cbf();
  });
};


/**
 * [bigPipe description]
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
exports.bigPipe = function(res, options, cbf){
  render(res, options, 'bigPipe', cbf);
};


exports.partial = function(res, options, cbf){
  render(res, options, 'partial', cbf);
};