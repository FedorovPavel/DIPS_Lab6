const   config				= require('./config'),
				crypto				= require('crypto'),
      	UserModel   	= require('./../app/models/users').userModel,
        ClientModel 	= require('./../app/models/client').clientModel,
        AccessToken  	= require('./../app/models/accesstoken').tokenModel,
        RefreshToken 	= require('./../app/models/refreshtoken').tokenModel;

//  Стратегия для распознования appId и appSecret
module.exports = {
	checkService : function(appId, appSecret, done){
		console.log('Проверка сервиса запрашивающего авторизацию по appId, appSecret');
		return ClientModel.findOne({appId : appId}, function(err, app_cli){
			if (err)
				return done(err, 500);
			if (!app_cli)
				return done('Application with this appId and appSecret not found', 401, false);
			if (app_cli.appSecret != appSecret)
				return done('Application with this appId and appSecret not found', 401, false);
			return done(null, null, app_cli);
		});
	},
	checkServiceById : function(appId, done){
		console.log('Проверка сервиса для выдачи code flow по appId');
		return ClientModel.findOne({appId : appId}, function(err, app_cli){
			if (err)
				return done(err, 500);
			if (!app_cli)
				return done('App not found', 404);
			return done(null, 200, true);
		});
	},
	getUserCode : function(login, password, done){
		console.log('Выдача code для пользователя');
		return UserModel.findOne({login: login}, function(err, user){
			if (err)
				return done(err , 500, null);
			if (!user)
				return done("User not found", 500, null);
			if (!user.checkPassword(password))
				return done("Password is wrong", 400, null);
			const code = user.code;
			return done(null, 200, code);
		});
	},
	checkServiceAccessToken : function(accessToken, done){
		console.log('Проверка сервиса запрашивающего авторизацию по token');
		return AccessToken.findOne({token : accessToken}, function(err, token){
			if (err)
				return done(err, 500);
			if (!token)
				return done('Application with this access token not found', 401, false);
			const timeLife = (Date.now() - token.created)/1000;
			if (timeLife > config.security.serviceTokenLife){
				token.remove(function(err){
					if (err)
						return done(err, 500, false);
				});
				return done('Access token is expired', 401, false);
			}
			const appId = token.userId;
			return ClientModel.findById(appId, function(err, application){
				if (err)
					return done(err, 500, false);
				if (!application)
					return done('Wrong access token', 404, false);
				return done(null, null, true);
			});
		});
	},
	setNewAccessTokenToApp : function(application, done){
		console.log('Выдача нового токена для app {' + application.name + '}');
		let tokenValue = crypto.randomBytes(32).toString('base64');
		let token = new AccessToken({
			userId 	: application.id,
			token	: tokenValue
		});
		return token.save(function(err, token){
			if (err)
				return done(err, 500, null);
			if (!token)
				return done('Token not saved', 500, null);
			let scope = {
				token : tokenValue,
				expires_in : config.security.serviceTokenLife
			};
			return done(null, null, scope);
		});
	},
	createTokenForUser : function(code, done){
		//  Ищем юзера с указанным логином
		console.log('Создание токена для юзера по code');
		return UserModel.findOne({code: code}, function(err, user){
			//  Если ошибка вернут ошибку
			if (err)
				return done(err, 500);
			//  Если пользователя нет вернуть провал получения токена
			if (!user)
				return done('User with this code not found', 401, false);
			//  Удаляем refreshToken
			RefreshToken.remove({userId: user.userId}, function(err){
				if (err) 
					return done(err);
				return console.log('Удален refresh-токен для пользователя ' + user.login);
			});
			//  Удаляем токен
			AccessToken.remove({userId : user.userId}, function(err){
				if (err)
					return done(err);
				return console.log('Удален access-токен для пользователя ' + user.login);
			});
			//  создаем токен
			let tokenValue = crypto.randomBytes(32).toString('base64');
			//  создаем refresh токен
			let refreshTokenValue = crypto.randomBytes(32).toString('base64');
			//  создаем объект БД токен
			let token = new AccessToken({
				token   : tokenValue,
				userId  : user.id
			});
			//  Создаем объект БД refresh-токен
			let refreshToken = new RefreshToken({
				token   : refreshTokenValue, 
				userId  : user.id
			});
			//  Сохраняем refresh-токен в БД
			return refreshToken.save(function(err){
				if (err)
					return done(err, 500);
				//  Сохраняем токен в БД
				return token.save(function(err, token){
					if (err)
						return done(err, 500);
					//  Считать валидацию OAuth успешной, вернуть 
					//  token
					//  refreshToken
					//  Время жизни токена
					let scope = {
						access_token 	: tokenValue,
						refresh_token 	: refreshTokenValue,
						expires_in		: config.security.userTokenLife
					};
					return done(null, null, scope);
				});
			});
		});
	},
	createTokenForUserByToken : function(refreshToken, done){
		//  Ищем указанный refreshToken
		console.log('Создание токена по refresh токену');
    	RefreshToken.findOne({token : refreshToken}, function(err, token){
        	//  Если токен не найден вернуть ошибку
        	if (err)
	            return done(err, 500);
        	//  Если нет такого токена обновление токена провалено
        	if (!token)
            	return done('Refresh token not found', 404, false);
        	//  Поиск юзера владельца refresh токена
        	UserModel.findById(token.userId, function(err, user){
	            //  Если возникла ошибка 
    	        if (err)
        	        return done(err, 500);
	            //  Если пользователь не найден - провал обновления токена
    	        if (!user)
        	        return done('User by this refresh token not found', 404, false);
            	//  Удаление старого refresh токена
            	RefreshToken.remove({userId : user.userId}, function(err){
                	if (err)
                    	return done(err, 500);
            	});
            	//  Удаление старого токена
            	AccessToken.remove({userId : user.userId}, function(err){
                	if (err)
                    	return done(err, 500);
            	});
            	//  Создание токена
            	let tokenValue = crypto.randomBytes(32).toString('base64');
	            //  Создание refresh токена
    	        let refreshTokenValue = crypto.randomBytes(32).toString('base64');
        	    //  Создание экземпляра токена для записи в БД
            	let token = new AccessToken({
                	token   : tokenValue, 
	                userId  : user.userId 
    	        });
        	    //  Создание экземпляра refresh токена для записи в БД
            	let refToken = new RefreshToken({
                	token   : refreshTokenValue, 
	                userId  : user.userId
    	        });
        	    //  записать refresh токен в БД
            	refToken.save(function(err){
	                if (err)
    	                return done(err, 500);
        	    });
	            //  записать токен в БД
    	        return token.save(function(err, token){
        	        if (err)
						return done(err, 500);
					if (!token)
						return done('Token was not saved', 500, false);
					//  Считать обновление refresh токена OAuth успешным, вернуть 
					let scope = {
						access_token	: tokenValue,
						refresh_token	: refreshTokenValue,
						expires_in		: config.security.userTokenLife
					}
            	    return done(null, null, scope);
            	});
			});
		});
	},
	checkUserByAccessToken : function(accessToken, done){
		console.log('Проверить user по access токена');
		//  Ищем токен
    	AccessToken.findOne({token : accessToken},function(err, token){
			//  Если ошибка вернуть ошибку
      		if (err)
				return done(err, 500);
			//  Если токен не найден вернуть провал верификации
      		if (!token)
				return done('Access token not found', 401, false);
			//  Расчет времени жизни
			const timeLife = Math.round((Date.now() - token.created)/1000); // В секундах
      		if(timeLife > config.security.tokenLife){
				//  Время жизни токена истекло надо его удалить 
        		AccessToken.remove({token : accessToken}, function(err){
          			if (err) return done(err, 500);
				});
				//  Сообщить что верификация провалена, токен стух
        		return done('Token expired', 401);
			}
			//  Поиск владельца токена
      		return UserModel.findById(token.userId, function(err, user){	
				//  Если ошибка вернуть ошибку
        		if (err)
					return done(err, 500);
				//  Если владелец не найден
        		if (!user)
					return done('Unkown user', 401);
        		return done(null, null, user);
      		});
    	});	
	}

}