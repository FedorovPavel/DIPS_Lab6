const mongoose  = require("mongoose"),
      amqp      = require("amqplib/callback_api");


let initHandlerAuthCode = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var q = 'authCode';
            ch.assertQueue(q, {durable: false});
            ch.prefetch(1);
            ch.consume(q, function reply(msg) {
                console.log('receive msg : ' + Buffer.from(msg.content).toString('utf-8'));
                ch.sendToQueue(msg.properties.replyTo,
                new Buffer('hello'),
                {correlationId: msg.properties.correlationId});

            ch.ack(msg);
            });
        });
    });
}();