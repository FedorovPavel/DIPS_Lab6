const   amqp = require('amqplib/callback_api'),
        mongoose = require('mongoose');

let initByCode = function(){
    const model = mongoose.model('StatAuthByCode');
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            const queue = 'authCodeComplete';
            ch.consume(queue, function(msg){
                const message = JSON.parse(Buffer.from(msg.content).toString("utf-8"));
                const id = msg.properties.correlationId;
                if (message.state == "OK"){
                    console.log('Record :' + id + " by AuthCode successfully processed on statistics server");
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                } else {
                    console.log('Record :' + id + " by AuthCode have status : "+message.state+" after processed on statistics server");
                    console.log('Detail info:');
                    console.log(message.descriptions);
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                }
            });
        });
    });
}();

let initByToken = function(){
    const model = mongoose.model('StatAuthByToken');
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            const queue = 'authTokenComplete';
            ch.consume(queue, function(msg){
                const message = JSON.parse(Buffer.from(msg.content).toString("utf-8"));
                const id = msg.properties.correlationId;
                if (message.state == "OK"){
                    console.log('Record :' + id + " by AuthToken successfully processed on statistics server");
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                } else {
                    console.log('Record :' + id + " by AuthToken have status : "+message.state+" after processed on statistics server");
                    console.log('Detail info:');
                    console.log(message.descriptions);
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                }
            });
        });
    });
}();

let initByDraftOrder = function(){
    const model = mongoose.model('StatInfoByDraftOrder');
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            const queue = 'draftOrderComplete';
            ch.consume(queue, function(msg){
                const message = JSON.parse(Buffer.from(msg.content).toString("utf-8"));
                const id = msg.properties.correlationId;
                if (message.state == "OK"){
                    console.log('Record :' + id + " by DraftOrder successfully processed on statistics server");
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                } else {
                    console.log('Record :' + id + " by DraftOrder have status : "+message.state+" after processed on statistics server");
                    console.log('Detail info:');
                    console.log(message.descriptions);
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                }
            });
        });
    });
}();