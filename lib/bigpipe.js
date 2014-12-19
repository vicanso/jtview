"use strict";
var _ = require('lodash');
var async = require('async');

/**
 * [exports description]
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
  if(!options){
    cbf(new Error('options is null'));
    return;
  }
  var main = options.main;
  if(!main){
   cbf(new Error('options.main in null'));
   return;
  }
  var finished = false;
  var partial = options.partial;
  res.render(main.view, main.data, function(err, html){
    if(err){
      finished = true;
      cbf(err);
      return;
    }
    //如果存在partial， 生成非闭合的html
    if(partial){
      html = html.replace('</html>', '');
      res.write(html);
    }else{
      res.send(html);
    }
  });

  if(!partial){
    return;
  }

  //生成script，将html插入到对应的id中
  var appendToHTML = function(id, html){
    if(finished){
      return;
    }
    res.write('<script>' +
      'document.getElementById("' + id + '").innerHTML= "' + html + '";' +
    '</script>');
  };


  // render部分的html
  var renderPartical = function(renderOptions, cbf){
    res.render(renderOptions.view, renderOptions.data, function(err, html){
      if(err){
        //如果出错，显示生成模板失败
        console.error(err);

        html = '生成模板失败！'
      }
      appendToHTML(renderOptions.id, html);
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
            // 如果获取数据出错，显示出错信息
            appendToHTML(id, '获取数据失败');
            cbf(null);
          }else{
            renderOptions.data = data;
            renderPartical(renderOptions, cbf);
          }
        });
      }else{
        renderOptions.data = config.data;
        renderPartical(renderOptions, cbf);
      }
    };
  });


  async.parallel(fnList, function(err){
    if(!finished){
      res.end('</html>');
    }
    finished = true;
    cbf();
  });
};