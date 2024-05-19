/**
 * Created by hazarapet on 3/20/15.
 */

var assert  = require("assert");
var fs      = require('fs');

/**
 * Test
 */
describe('Preparing to check paths...', function(){

    it('Should exist the path "logs/"',function(){
        var path = 'logs/';
        assert.equal(fs.existsSync(path),true);
    });

    it('Should exist the file "logs/dev.log"',function(){
        var path = 'logs/dev.log';
        assert.equal(fs.existsSync(path),true);
    });

    it('Should exist the file "logs/prod.log"',function(){
        var path = 'logs/prod.log';
        assert.equal(fs.existsSync(path),true);
    });
});