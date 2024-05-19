/**
 * Created by hazarapet on 3/20/15.
 */

var assert  = require("assert");
var fs      = require('fs');

/**
 * @param owner
 * @param inGroup
 * @param mode
 * @returns {*|number}
 */
function canWrite(path, callback) {
    fs.open(path,'r+',function (err, fd) {
        if (err) {
            return callback(false);
        }
        fs.close(fd, function (err) {
            if (err) return callback(false);
            callback(true);
        });
    });
};

/**
 * @param result
 */
function check(result){
    assert.ok(result);
}
/**
 * Test
 */
describe('Preparing to check paths...', function(){

    it('Should exist the path "logs/"',function(){
        var path = 'logs/';
        assert.equal(fs.existsSync(path),true);
        assert.equal(fs.statSync(path).isDirectory(),true);
    });

    it('Should exist the file "logs/dev.log"',function(){
        var path = 'logs/dev.log';
        assert.equal(fs.existsSync(path),true);
        assert.equal(fs.statSync(path).isFile(),true);
    });

    it('Should exist the file "logs/prod.log"',function(){
        var path = 'logs/prod.log';
        assert.equal(fs.existsSync(path),true);
        assert.equal(fs.statSync(path).isFile(),true);
    });
});

/**
 * Test
 */
describe('Preparing to check paths permissions...',function(){
    it('Should be writable logs/dev.log and logs/prod.log files',function(){
        var dev = 'logs/dev.log';
        var prod = 'logs/prod.log';
        canWrite(dev,check);
        canWrite(prod,check);
    })
});