"use strict";
var assert = require('assert');
var partial = require('../lib/partial');
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

  describe('#partial', function(){
    it('should render partial way successful', function(done){
      var resData = '<!DOCTYPE html><html lang="zh-CN" ng-app="jtApp"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="author" content="小墨鱼 vicanso 腻味 tree"></head><body><h1>vicanso</h1><div id="book"><ul><li>代码大全</li><li>javascript</li></ul></div><div id="authorListContainer" class="authorList"><ul><li>vicanso</li><li>jenny</li></ul></div></body></html>';
      var resMock = {
        render : renderFile,
        send : function(html){
          assert.equal(html, resData);
          done();
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
      partial(resMock, options, function(err){
        if(err){
          done(err);
        }
        
      });
    });
  });
});