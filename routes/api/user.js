var express = require('express');
var router = express.Router();
const db = require('../../middleware/db')
const crypt = require('../../middleware/crypt');

const KEY = crypt.getKeyFromPassword(process.env.USER_ENCRYPT_PASSWORD, Buffer.from(process.env.USER_ENCRYPT_SALT));

/**
 * Adds a user to the database.
 */
router.post('/add', async function(req, res, next){
    if(!req.body){
        return res.json({"success": false, "message": "Invalid data received!"}).status(400);
    }

    let query = "INSERT INTO User VALUES(NULL, ?,?)";
    let values = [await crypt.encrypt(req.body['user_email'], KEY),
                  await crypt.encrypt(req.body['user_password'], KEY)
                ];

    let data = await db.query(db.pool, query, values).catch((err) => {
        return res.json({"success": false, "message": "Failed to add user to db!"}).status(400);
    });

    console.log(data);
    return res.json({"success": true, "message":"User inserted successfully"});
})

/**
 * Attempts to log a user into the website. Either returns true if successful, or false if unsuccessful.
 */
router.get('/login', async function (req, res, next) {
    if (!req.query.email || !req.query.password) {
        return res.render('login', {success: false});
    }

    var query = 'SELECT user_email, user_password FROM User WHERE user_email = ? AND user_password = ? LIMIT 1;';
    let values = null;
    try{
        values = [await crypt.encrypt(req.query['email'], KEY),
                  await crypt.encrypt(req.query['password'], KEY)
                ];
    }catch(err){
        return res.json({"success": false, "message": "Invalid credentials!"}).status(400);
    }

    let user = await db.query(db.pool, query, values).catch((err) =>{
        return null;
    });
 
    var query = 'SELECT COUNT(admin_email) FROM Adminstrator ' +
                'WHERE admin_email = ' + db.pool.escape(user[0].user_email) 
                ' Limit 1';

    let isAdmin = await db.query(db.pool, query, values).catch((err) => {
        return 0;
    });

    if (Array.isArray(user) && user.length) {
        try{
            req.session.user = await decrypt_dict(user[0]);
            req.session.isAdmin = isAdmin == 1;
            return res.json({ success: true });
        }catch(err){
            return res.json({ "success": false , "message": "Incorrect Credentials!"});
        }
    } else {
        delete req.session.user;
        delete req.session.username;
        return res.json({ "success": false , "message": "Incorrect Credentials!"});
    }
});

/**
 * Logs a user out of the website.
 */
router.get('/logout', async function (req, res, next) {
    if(req.session.user){
        delete req.session.user;
    }

    if(req.session.isAdmin){
        delete req.session.isAdmin;
    }

    return res.json({ success: true });
});

//============================ helper functions ============================

/**
 * Decrypts a JSON of student info.
 * @param {JSON} dict 
 * @returns JSON that is decrypted student info.
 */
 async function decrypt_dict(dict){
    let decrypted_dict = {};

    for (var key in dict){
        if(!Buffer.isBuffer(dict[key]) && dict[key] != null){
            decrypted_dict[key] = {};
            for( var key2 in dict[key]){
                if(dict[key] != null){
                    decrypted_dict[key][key2] = (await crypt.decrypt(dict[key][key2], KEY)).toString('utf-8');
                }else{
                    decrypted_dict[key][key2] = null;
                }
            }
        }else{
            console.log(dict[key])
            if(dict[key] != null){
                decrypted_dict[key] = (await crypt.decrypt(dict[key], KEY)).toString('utf-8');
            }else{
                decrypted_dict[key] = null;
            }
        }
    }

    return decrypted_dict;
}
module.exports = router;