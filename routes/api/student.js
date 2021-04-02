var express = require('express');
var router = express.Router();
const db = require('../../middleware/db')
const crypt = require('../../middleware/crypt');

const KEY = crypt.getKeyFromPassword(process.env.STUDENT_ENCRYPT_PASSWORD, Buffer.from(process.env.STUDENT_ENCRYPT_SALT));

router.post('/add', async function(req, res, next){
    if(!req.session.user || !req.session.user.isAdmin){
        return res.json({"success": false, "message": "Access denied!"}).status(401);
    }else if(!req.body){
        return res.json({success:false, message: 'error: invalid data received'});
    }   
    
    encrypted_dict = null;
    try{
        encrypted_dict = await encrypt_dict(req.body)
    }catch(err){
        return res.json({"success": false, "message": "error encrypting data"});
    }

    // inserts father into db
    let father_id = null;
    let father_query = 'INSERT INTO Father VALUES(NULL,?,?,?,?,?,?,?,?)';
    if(encrypted_dict['father']){
        var values = []
        for(var i in encrypted_dict['father']){
            values.push(encrypted_dict['father'][i]);
        }

        father = await db.query(db.pool, father_query, values).catch((err) => {
            return null;
        });
        father_id = father ? father.insertId : null;
    }

    // inserts mother into db
    let mother_query = 'INSERT INTO Mother VALUES(NULL,?,?,?,?,?,?,?,?)';
    let mother_id = null;
    if(encrypted_dict['mother']){
        var values = []
        for(var i in encrypted_dict['mother']){
            values.push(encrypted_dict['mother'][i]);
        }

        mother = await db.query(db.pool, mother_query, values).catch((err) => {
            return null;
        });
        mother_id = mother ? mother.insertId : null;
    }
    
    // inserts guardian into db
    let guardian_query = 'INSERT INTO Guardian VALUES(NULL,?,?,?)';
    let guardian_id = null;
    if(encrypted_dict['guardian']){
        var values = []
        for(var i in encrypted_dict['guardian']){
            values.push(encrypted_dict['guardian'][i]);
        }

        guardian = await db.query(db.pool, guardian_query, values).catch((err) => {
            return null;
        });
        guardian_id = guardian ? guardian.insertId : null;
    }

    // inserts student into db
    let student_query = 'INSERT INTO Student VALUES(NULL,?,?,?,?,?,?,?,?,?,?)';
    var values = [
        encrypted_dict['student_email'], encrypted_dict['student_first_name'], encrypted_dict['student_middle_name'],
        encrypted_dict['student_last_name'], encrypted_dict['student_phone_number'], father_id, mother_id, guardian_id,
        encrypted_dict['student_grade'], encrypted_dict['student_status']
    ];

    student = await db.query(db.pool, student_query, values).catch((err) => {
        return {insertId: -1};
    });

    return res.json({success: student.insertId > -1});
});

router.put('/update', async function(req, res, next){
    return;
});

router.delete('/remove', async function(req, res, next){
    /*
        DELETE FROM Father WHERE father_id NOT IN (SELECT Student.father_id FROM Student);
        DELETE FROM Mother WHERE mother_id NOT IN (SELECT Student.father_id FROM Student);
        DELETE FROM Guardian WHERE guardian_id NOT IN (SELECT Student.guardian_id FROM Student);
    */

    return;
});

router.get('/', async function(req, res, next){
    if(!req.session.user || !req.session.user.isAdmin){
        return res.json({"success": false, "message": "Access denied!"}).status(401);
    }

    let query = `
                SELECT student_email, student_first_name, student_middle_name, student_last_name
                student_phone_number, student_grade, student_status, f.father_first_name, 
                f.father_last_name, f.father_phone_number, f.father_email, f.father_education,
                f.father_place_birth, f.father_employer, f.father_job_title, m.mother_first_name,
                m.mother_last_name, m.mother_phone_number, m.mother_email, m.mother_education,
                m.mother_place_birth, m.mother_employer, m.mother_job_title, g.guardian_name,
                g.guardian_email, g.guardian_phone_number
                FROM Student s
                LEFT JOIN Father f on s.father_id = f.father_id 
                LEFT JOIN Mother m on s.mother_id = m.mother_id
                LEFT JOIN Guardian g on s.guardian_id = g.guardian_id
    `;

    data = await db.query(db.pool, query).catch((err) => {
        return null;
    });

    decrypted_data = [];
    for(var i in data){
        decrypted_data.push(await decrypt_dict(data[i]));
    }

    return res.json(decrypted_data);
});

//=================================== helper methods ===================================

/**
 * Encrypts a JSON of student info.
 * @param {JSON} dict 
 * @returns JSON of encrypted student info.
 */
 async function encrypt_dict(dict){
    let encrypted_dict = {};

    for (var key in dict){
        if(typeof(typeof(dict[key]) !== null) && typeof(dict[key]) === 'object'){
            encrypted_dict[key] = {};
            for( var key2 in dict[key]){
                encrypted_dict[key][key2] = await crypt.encrypt(crypt.arrayToBuffer(dict[key][key2]), KEY);
            }
        }else{
            encrypted_dict[key] = await crypt.encrypt(crypt.arrayToBuffer(dict[key]), KEY);
        }
    }

    return encrypted_dict;
}

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