const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StatSchema = new Schema({
  state: String,
  messageId: String,
  message : String
});

StatSchema.statics.addRecord = function(info, callback){
  const model = mongoose.model('AuthTokenInfo');
  const item = new model({
    state     : info.state,
    messageId : info.id,
    message   : info.message
  });
  return item.save(function(err, ref_item){
    if (err)
      return callback(err, null);
    if (!ref_item)
      return callback(null, null);
    return callback(null, ref_item.getRecord());
  });
}

StatSchema.statics.checkRecord = function(messageId, callback){
  return this.find({messageId : messageId}, function(err, record){
    if (err)
      return callback(err, null);
    if (!record)
      return callback(null, false);
    return callback(null, record);
  });
}

StatSchema.statics.getAllRecord = function(callback){
    return this.find({}, function(err ,records){
      if (err)
        return callback(err, null);
      if (!records)
        return callback(null, null);
      let result = [];
      for (let I = 0; I < records.lenght; I++)
        result.push(records[I].getShort());
      return callback(null, result);
    });
}

StatSchema.methods.getRecord = function(){
  const data = {
    id        : this.id,
    state     : this.state,
    messageId : this.messageId,
    message   : this.message
  };
  return data;
}

StatSchema.methods.getShort = function(){
    const data = {
      id        : this.id,
      state     : this.state,
      message   : this.message
    };
    return data;
  }

mongoose.model('AuthTokenInfo', StatSchema);

