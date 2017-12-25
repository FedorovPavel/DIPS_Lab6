const mongoose  = require("mongoose"),
      amqp      = require("amqplib/callback_api");


let initHandlerAuthCode = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'authCode';
            ch.assertQueue(queue, {durable: false});
            ch.prefetch(10);
            ch.consume(queue, function reply(msg) {
                ProccesedAuthCodeRecord(msg, function(response){
                    const res = JSON.stringify(response);
                    ch.sendToQueue(
                        msg.properties.replyTo,
                        new Buffer(res),
                        {
                            correlationId: msg.properties.correlationId
                        }
                    );
                    ch.ack(msg);
                });
            });
        });
    });
}();

let initHandlerAuthToken = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'authToken';
            ch.assertQueue(queue, {durable: false, exclusive : true});
            ch.prefetch(10);
            ch.consume(queue, function reply(msg) {
                ProccesedAuthTokenRecord(msg, function(response){
                    const res = JSON.stringify(response);
                    ch.sendToQueue(
                        msg.properties.replyTo,
                        new Buffer(res),
                        {
                            correlationId: msg.properties.correlationId
                        }
                    );
                    ch.ack(msg);
                });
            });
        });
    });
}();

let initHandlerDraftOrder = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'draftOrder';
            ch.assertQueue(queue, {durable: false, exclusive : true});
            ch.prefetch(10);
            ch.consume(queue, function reply(msg) {
                ProccesedDraftOrderRecord(msg, function(response){
                    const res = JSON.stringify(response);
                    ch.sendToQueue(
                        msg.properties.replyTo,
                        new Buffer(res),
                        {
                            correlationId: msg.properties.correlationId
                        }
                    );
                    ch.ack(msg);
                });
            });
        });
    });
}();

function ProccesedAuthCodeRecord(msg, callback){
    const model = mongoose.model('AuthCodeInfo');
    const message = JSON.parse(JSON.parse(Buffer.from(msg.content).toString("utf-8")).info);
    const id = msg.properties.correlationId;
    let response = {};
    return model.checkRecord(id, function(err, record){
        if (err)
            return console.log("DB ERROR");
        if (record == false){
            let data = {
                messageId : id,
                message : JSON.stringify(message)
            };
            if (message.status && message.status == 200){
                response.state = "OK";
                data.state = "OK";
                console.log('AuthCodeInfo : OK for id :' + id);
                return model.addRecord(data, function(err, result){
                    if (err)
                        return console.log('DB ERROR');
                    return callback(response);
                });
            } else {
                console.log('AuthCodeInfo : ERROR for id :' + id);
                response.state = "ERROR";
                response.description = "Invalid message status or undefined ";
                data.state = "ERROR";
                return model.addRecord(data, function(err, result){
                    if (err)
                        return console.log("DB ERROR");
                    return callback(response);
                });
            }
        } else {
            response.state = record.state;
            if (response.state != "OK")
                response.description = "Invalid message status or undefined";
            return;// callback(response);
        }
    })
};

function ProccesedAuthTokenRecord(msg, callback){
    const model = mongoose.model('AuthTokenInfo');
    const message = JSON.parse(JSON.parse(Buffer.from(msg.content).toString("utf-8")).info);
    const id = msg.properties.correlationId;
    let response = {};
    return model.checkRecord(id, function(err, record){
        if (err)
            return console.log("DB ERROR");
        if (record == false){
            let data = {
                messageId : id,
                message : JSON.stringify(message)
            };
            if (message.status && message.status == 200){

                response.state = "OK";
                data.state = "OK";
                console.log('AuthTokenInfo : OK for id :' + id);
                return model.addRecord(data, function(err, result){
                    if (err)
                        return console.log('DB ERROR');
                    return callback(response);
                });
            } else {
                console.log('AuthTokenInfo : ERROR for id :' + id);
                response.state = "ERROR";
                response.description = "Invalid message status or undefined ";
                data.state = "ERROR";
                return model.addRecord(data, function(err, result){
                    if (err)
                        return console.log("DB ERROR");
                    return callback(response);
                });
            }
        } else {
            response.state = record.state;
            if (response.state != "OK")
                response.description = "Invalid message status or undefined";
            return;// callback(response);
        }
    });
};

function ProccesedDraftOrderRecord(msg, callback){
    const model = mongoose.model('DraftOrderInfo');
    const message = JSON.parse(JSON.parse(Buffer.from(msg.content).toString("utf-8")).info);
    const id = msg.properties.correlationId;
    let response = {};
    return model.checkRecord(id, function(err, record){
        if (err)
            return console.log("DB ERROR");
        if (record == false){
            let data = {
                messageId : id,
                message : JSON.stringify(message)
            };
            if (message.status && message.status == 201){
                response.state = "OK";
                data.state = "OK";
                console.log('DraftOrderInfo : OK for id :' + id);
                return model.addRecord(data, function(err, result){
                    if (err)
                        return console.log('DB ERROR');
                    return callback(response);
                });
            } else {
                console.log('DraftOrderInfo : ERROR for id :' + id);
                response.state = "ERROR";
                response.description = "Invalid message status or undefined ";
                data.state = "ERROR";
                return model.addRecord(data, function(err, result){
                    if (err)
                        return console.log("DB ERROR");
                    return callback(response);
                });
            }
        } else {
            response.state = record.state;
            if (response.state != "OK")
                response.description = "Invalid message status or undefined";
            return;// callback(response);
        }
    });
};