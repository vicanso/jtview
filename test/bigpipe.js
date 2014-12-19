"use strict";
var assert = require('assert');
var bigPipe = require('../lib/bigpipe');
var jade = require('jade');
var fs = require('fs');
var path = require('path');


describe('#bigPipe', function(){
  var renderFile = function(file, data, cbf){
    file = path.join(__dirname, '../views', file);
    fs.readFile(file + '.jade', 'utf8', function(err, html){
      if(err){
        cbf(err);
        return;
      }
      try{
        html = jade.render(html, data)
      }catch(err){
        cbf(err);
        return;
      }
      cbf(null, html);
    });
  };
  var noop = function(){};

  
  it('should render normal way successful', function(done){
    var resData = '<!DOCTYPE html><html lang="zh-CN" ng-app="jtApp"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="author" content="小墨鱼 vicanso 腻味 tree"></head><body><h1>vicanso</h1><div id="book"></div><div id="authorListContainer"></div></body></html>';
    var resMock = {
      render : renderFile,
      send : function(html){
        assert.equal(html, resData);
        done();
      }
    };

    var options = {
      main : {
        view : 'index',
        data : {
          name : 'vicanso'
        }
      }
    };
    bigPipe(resMock, options, function(err){
      if(err){
        done(err);
      }
    });
  });

  it('should render bigpipe way successful', function(done){
    var htmlArr = [];
    var resData = '<!DOCTYPE html><html lang="zh-CN" ng-app="jtApp"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="author" content="小墨鱼 vicanso 腻味 tree"></head><body><h1>vicanso</h1><div id="book"></div><div id="authorListContainer"></div></body><script>document.getElementById("authorListContainer").innerHTML= "<ul><li>vicanso</li><li>jenny</li></ul>";</script><script>document.getElementById("book").innerHTML= "<ul><li>代码大全</li><li>javascript</li></ul>";</script></html>';
    var resMock = {
      render : renderFile,
      write : function(html){
        htmlArr.push(html);
      },
      end : function(html){
        htmlArr.push(html);
      }
    };
    var bookList = {
      view : 'book',
      data : function(cbf){
        setTimeout(function(){
          cbf(null, {
            books : ['代码大全', 'javascript']
          });
        }, 300);
      }
    };
    var authorList = {
      view : 'author',
      id : 'authorListContainer',
      data : {
        authors : ['vicanso', 'jenny']
      }
    };
    var options = {
      main : {
        view : 'index',
        data : {
          name : 'vicanso'
        }
      },
      partial : {
        book : bookList,
        author : authorList
      }
    };
    bigPipe(resMock, options, function(err){
      if(err){
        done(err);
      }else{
        assert.equal(resData, htmlArr.join(''));
        done();
      }
    });
  });


  it('should render bigpipe way with error successful', function(done){
    var htmlArr = [];
    var resData = '<!DOCTYPE html><html lang="zh-CN" ng-app="jtApp"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="author" content="小墨鱼 vicanso 腻味 tree"></head><body><h1>vicanso</h1><div id="book"></div><div id="authorListContainer"></div></body><script>document.getElementById("authorListContainer").innerHTML= "生成模板失败！";</script><script>document.getElementById("book").innerHTML= "获取数据失败";</script></html>';
    var resMock = {
      render : renderFile,
      write : function(html){
        htmlArr.push(html);
      },
      end : function(html){
        htmlArr.push(html);
      }
    };
    var bookList = {
      view : 'book',
      data : function(cbf){
        setTimeout(function(){
          cbf(new Error('get book fail'));
        }, 300);
      }
    };
    var authorList = {
      view : 'author',
      id : 'authorListContainer',
      data : {
        
      }
    };
    var options = {
      main : {
        view : 'index',
        data : {
          name : 'vicanso'
        }
      },
      partial : {
        book : bookList,
        author : authorList
      }
    };
    bigPipe(resMock, options, function(err){
      if(err){
        done(err);
      }else{
        assert.equal(resData, htmlArr.join(''));
        done();
      }
    });
  });
});