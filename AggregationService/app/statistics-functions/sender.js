const mongoose  = require("mongoose"),
      amqp      = require("amqplib/callback_api"),
      receiver  = require('./receiver'),
      config    = require('./../../config/config'),
      timeoutStep = config.app.timeout,
      repeatCount = config.app.repeat;

module.exports = {
    sendAuthorizationInfo : function(info){
        const model = mongoose.model('StatAuthByCode');
        info = JSON.stringify(info);
        return model.addRecord(info, function(err, container){
            if (err){
                console.log('DB error : ');
                console.log(err);
                return;
            }
            if (!container){
                console.log("DB error : don't create record");
                return;
            }
            const id = container.id;
            delete container.id;
            delete container.count;
            bindForTimeOut(id, checkRecordByAuthCode);
            pushToQueueAuthByCode(id, JSON.stringify(container));
            return;
        });
    },
    sendAuthorizationByTokenInfo : function(info){
        const model = mongoose.model('StatAuthByToken');
        info = JSON.stringify(info);
        return model.addRecord(info, function(err, container){
            if (err){
                console.log('DB error : ');
                console.log(err);
                return;
            }
            if (!container){
                console.log("DB error : don't create record");
                return;
            }
            const id = container.id;
            delete container.id;
            delete container.count;
            bindForTimeOut(id, checkRecordByAuthToken);
            pushToQueueAuthByToken(id, JSON.stringify(container));
            return;
        });
    },
    sendInfoByDraftOrder : function(info){
        const model = mongoose.model('StatInfoByDraftOrder');
        info = JSON.stringify(info);
        return model.addRecord(info, function(err, container){
            if (err){
                console.log('DB error : ');
                console.log(err);
                return;
            }
            if (!container){
                console.log("DB error : don't create record");
                return;
            }
            const id = container.id;
            delete container.id;
            delete container.count;
            bindForTimeOut(id, checkRecordByAuthToken);
            pushToQueueAuthByToken(id, JSON.stringify(container));
            return;
        });
    }
}

function bindForTimeOut(id, handler){
    let db_id = id;
    setTimeout(function(){
        handler(id);
    }, timeoutStep);
}

function pushToQueueAuthByCode(id, info){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'authCodeTask';

            ch.assertQueue(queue, {durable : false});

            ch.prefetch(1);
        
            ch.sendToQueue(queue, Buffer(info),{
                correlationId : id
            });
            console.log('Record id: ' + id + ' push to queue [' + queue + ']');
        });
    });
}

function pushToQueueAuthByToken(id, info){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'authTokenTask';

            ch.assertQueue(queue, {durable : false});

            ch.prefetch(1);
        
            ch.sendToQueue(queue, Buffer(info),{
                correlationId : id
            });
            console.log('Record id: ' + id + ' push to queue [' + queue + ']');
        });
    });
}

function pushToQueueDraftOrder(id, info){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'draftOrderTask';

            ch.assertQueue(queue, {durable : false});

            ch.prefetch(1);
        
            ch.sendToQueue(queue, Buffer(info),{
                correlationId : id
            });
            console.log('Record id: ' + id + ' push to queue [' + queue + ']');
        });
    });
}

function checkRecordByAuthCode(id){
    const model = mongoose.model('StatAuthByCode');
    return model.getByRepeat(id, function(err, record){
        if (err)
            return console.log(err);
        if (record != null){
            console.log("TimeOut for record : " + id);
            if (record.count < repeatCount){
                return model.incrementCounter(id, function(err, state){
                    if (err)
                        return console.log(err);
                    if (!state)
                        return console.log('fail to increment');
                    bindForTimeOut(id, checkRecordByAuthCode);
                    delete record.count;
                    delete record.id;
                    return pushToQueueAuthByCode(id, JSON.stringify(record));
                });
            }else {
                console.log("Record :" + id +" exceeded the number of redirects");
                // return model.removeRecord(id, function(err, state){
                //     if (err)
                //         return console.log(err);
                //     if (!state){
                //         return console.log('Record not found or can not remove');
                //     }
                //     return console.log('Record successfully removed');
                // });
            }
        }
    });
}

function checkRecordByAuthToken(id){
    const model = mongoose.model('StatAuthByToken');
    return model.getByRepeat(id, function(err, record){
        if (err)
            return console.log(err);
        if (record != null){
            console.log("Statistics by refreshToken : TimeOut for record : " + id);
            if (record.count < repeatCount){
                return model.incrementCounter(id, function(err, state){
                    if (err)
                        return console.log(err);
                    if (!state)
                        return console.log('fail to increment');
                    bindForTimeOut(id, checkRecordByAuthToken);
                    delete record.count;
                    delete record.id;
                    return pushToQueueAuthByToken(id, JSON.stringify(record));
                });
            }else {
                console.log("Record :" + id +" exceeded the number of redirects");
                // return model.removeRecord(id, function(err, state){
                //     if (err)
                //         return console.log(err);
                //     if (!state){
                //         return console.log('Record not found or can not remove');
                //     }
                //     return console.log('Record successfully removed');
                // });
            }
        }
    });
}

function checkRecordByDraftOrder(id){
    const model = mongoose.model('StatAuthByToken');
    return model.getByRepeat(id, function(err, record){
        if (err)
            return console.log(err);
        if (record != null){
            console.log("Statistics by refreshToken : TimeOut for record : " + id);
            if (record.count < repeatCount){
                return model.incrementCounter(id, function(err, state){
                    if (err)
                        return console.log(err);
                    if (!state)
                        return console.log('fail to increment');
                    bindForTimeOut(id, checkRecordByDraftOrder);
                    delete record.count;
                    delete record.id;
                    return pushToQueueDraftOrder(id, JSON.stringify(record));
                });
            }else {
                console.log("Record :" + id +" exceeded the number of redirects");
                // return model.removeRecord(id, function(err, state){
                //     if (err)
                //         return console.log(err);
                //     if (!state){
                //         return console.log('Record not found or can not remove');
                //     }
                //     return console.log('Record successfully removed');
                // });
            }
        }
    });
}