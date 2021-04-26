var express = require('express');
var router = express.Router();
const db = require('../../middleware/db')
const crypt = require('../../middleware/crypt');

const KEY = crypt.getKeyFromPassword(process.env.STUDENT_ENCRYPT_PASSWORD, Buffer.from(process.env.STUDENT_ENCRYPT_SALT));

router.post('/add', async function (req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.json({ "success": false, "message": "Access denied!" }).status(401);
    }

    if (!req.body) {
        return res.json({ success: false, message: 'error: invalid data received' });
    }

    let encrypted_dict = null;
    try {
        encrypted_dict = await encrypt_dict(req.body)
    } catch (err) {
        return res.json({ "success": false, "message": "error encrypting data" });
    }

    let insertId = await new Promise((resolve) => {
        db.pool.getConnection(async (err, conn) => {
            let temp = await new Promise((resolve, reject) => {
                conn.beginTransaction(async (err) => {
                    if (err) {
                        conn.rollback(() => {
                            conn.release();
                        });
                    } else {
                        // inserts father into db
                        let father_id = null;
                        let father_query = 'INSERT INTO Father VALUES(NULL,?,?,?,?,?,?,?,?)';
                        if (encrypted_dict['father']) {
                            var values = []
                            for (var i in encrypted_dict['father']) {
                                values.push(encrypted_dict['father'][i]);
                            }

                            father = await db.query(conn, father_query, values).catch((err) => {
                                return null;
                            });
                            father_id = father ? father.insertId : null;
                        }

                        // inserts mother into db
                        let mother_query = 'INSERT INTO Mother VALUES(NULL,?,?,?,?,?,?,?,?)';
                        let mother_id = null;
                        if (encrypted_dict['mother']) {
                            var values = []
                            for (var i in encrypted_dict['mother']) {
                                values.push(encrypted_dict['mother'][i]);
                            }

                            mother = await db.query(conn, mother_query, values).catch((err) => {
                                return null;
                            });
                            mother_id = mother ? mother.insertId : null;
                        }

                        // inserts guardian into db
                        let guardian_query = 'INSERT INTO Guardian VALUES(NULL,?,?,?)';
                        let guardian_id = null;
                        if (encrypted_dict['guardian']) {
                            var values = []
                            for (var i in encrypted_dict['guardian']) {
                                values.push(encrypted_dict['guardian'][i]);
                            }

                            guardian = await db.query(conn, guardian_query, values).catch((err) => {
                                return null;
                            });
                            guardian_id = guardian ? guardian.insertId : null;
                        }

                        // prepare values and query to insert student into db
                        let student_query = 'INSERT INTO Student VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?)';
                        var values = [
                            encrypted_dict['student_email'], encrypted_dict['student_first_name'], encrypted_dict['student_middle_name'],
                            encrypted_dict['student_last_name'], encrypted_dict['student_phone_number'], father_id, mother_id, guardian_id,
                            encrypted_dict['student_grade'], encrypted_dict['student_status'], encrypted_dict['student_city'],
                            encrypted_dict['student_school']
                        ];

                        // try to insert student into db
                        let student = await db.query(conn, student_query, values).catch((err) => {
                            return { insertId: -1 };
                        });
                        let insertId = student.insertId;

                        // if insertId is less then 0 then the insert has failed so we need to rollback the changes
                        if (insertId < 0) {
                            conn.rollback(() => {
                                conn.release();
                            });
                            resolve(insertId);
                        } else {
                            // commit the changes
                            conn.commit((err) => {
                                // if a error occurs rollback the changes.
                                if (err) {
                                    conn.rollback(() => {
                                        conn.release();
                                    });
                                    reject(err);
                                } else {
                                    conn.release();
                                    resolve(insertId);
                                }
                            });
                        }
                    }
                });
            }).catch((err) => {
                return -1;
            });
            resolve(temp);
        });
    }).catch((err) => {
        return -1;
    });

    return res.json({ success: insertId > -1 });
});

router.put('/update', async function (req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.json({ "success": false, "message": "Access denied!" }).status(401);
    }

    if (!req.body) {
        return res.json({ success: false, message: 'error: invalid data received' });
    }

    console.log(req.body)

    let encrypted_dict = null;
    try {
        encrypted_dict = await encrypt_dict(req.body)
    } catch (err) {
        return res.json({ "success": false, "message": "error encrypting data" });
    }

    let affectedRows = await new Promise((resolve, reject) => {
        db.pool.getConnection(async (err, conn) => {
            conn.beginTransaction(async (err) => {
                if (err) {
                    conn.rollback(() => {
                        conn.release();
                    });
                } else {
                    let ids_query = "SELECT father_id, mother_id, guardian_id, student_id FROM Student WHERE student_id = ?";
                    let values = [req.body['student_id']];
                    let affectedRows = -1;

                    let ids = await db.query(conn, ids_query, values).catch((err) => {
                        console.log(err);
                        return null;
                    });

                    if (Array.isArray(ids) && ids.length) {
                        // father
                        let father_query = 'UPDATE Father SET '
                            + 'father_first_name = IFNULL(?, father_first_name), '
                            + 'father_last_name = IFNULL(?, father_last_name), '
                            + 'father_phone_number = IFNULL(?, father_phone_number), '
                            + 'father_email = IFNULL(?, father_email), '
                            + 'father_education = IFNULL(?, father_education), '
                            + 'father_place_birth = IFNULL(?, father_place_birth), '
                            + 'father_employer = IFNULL(?, father_employer), '
                            + 'father_job_title = IFNULL(?, father_job_title) '
                            + 'WHERE father_id = ?;';
                        let father_values = [req.body["father_first_name"], req.body["father_last_name"], req.body["father_phone_number"], req.body["father_email"],
                        req.body["father_education"], req.body["father_place_birth"], req.body["father_employer"], req.body["father_job_title"], ids[0].father_id];
                        if (ids[0].father_id) {
                            var temp = await db.query(conn, father_query, father_values).catch((err) =>{
                                return {affectedRows: 0}
                            });

                            affectedRows += temp.affectedRows;
                        }

                        // mother
                        let mother_query = 'UPDATE Mother SET '
                            + 'mother_first_name = IFNULL(?, mother_first_name), '
                            + 'mother_last_name = IFNULL(?, mother_last_name), '
                            + 'mother_phone_number = IFNULL(?, mother_phone_number), '
                            + 'mother_email = IFNULL(?, mother_email), '
                            + 'mother_education = IFNULL(?, mother_education), '
                            + 'mother_place_birth = IFNULL(?, mother_place_birth), '
                            + 'mother_employer = IFNULL(?, mother_employer), '
                            + 'mother_job_title = IFNULL(?, mother_job_title) '
                            + 'WHERE mother_id = ?;';
                        let mother_values = "";
                        if (ids[0].mother_id) {

                        }

                        // guardian
                        let guardian_query = "";
                        let guaridan_values = "";
                        if (ids[0].guardian_id) {

                        }
                    }

                    // if affectedRows is less then 0 then the delete has failed so we need to rollback the changes
                    if (affectedRows < 0) {
                        conn.rollback(() => {
                            conn.release();
                        });
                        resolve(affectedRows);
                    } else {
                        // commit the changes
                        conn.commit((err) => {
                            // if a error occurs rollback the changes.
                            if (err) {
                                conn.rollback(() => {
                                    conn.release();
                                });
                                reject(err);
                            } else {
                                conn.release();
                                resolve(affectedRows);
                            }
                        });
                    }
                }
            });
        });
    }).catch((err) => {
        return -1;
    });

    return res.json({ success: affectedRows > 0 });
});

/**
 * Deletes a student from the db and removes the student's mother, father, and guardian 
 * from the db.
 */
router.delete('/remove', async function (req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.json({ "success": false, "message": "Access denied!" }).status(401);
    }

    if (!req.body["student_id"]) {
        return res.json({ success: false, message: "invalid request" }).status(400);
    }

    let affectedRows = await new Promise((resolve, reject) => {
        db.pool.getConnection(async (err, conn) => {
            conn.beginTransaction(async (err) => {
                if (err) {
                    conn.rollback(() => {
                        conn.release();
                    });
                } else {
                    // queries
                    let query = "SELECT father_id, mother_id, guardian_id FROM STUDENT WHERE student_id = ?;";
                    let query_delete_father = "DELETE FROM Father WHERE father_id = ?";
                    let query_delete_mother = "DELETE FROM Mother WHERE mother_id = ?";
                    let query_delete_guardian = "DELETE FROM Guardian WHERE guardian_id = ?;";
                    let query_delete_student = "DELETE FROM Student WHERE student_id = ?;";
                    let values = req.body["student_id"];

                    let ids = await db.query(conn, query, values).catch((err) => {
                        return [];
                    })

                    // delete student
                    let data = await db.query(conn, query_delete_student, values).catch((err) => {
                        return { affectedRows: -1 };
                    });

                    if (Array.isArray(ids) && ids.length) {
                        // delete father of student
                        await db.query(conn, query_delete_father, [ids[0].father_id]).catch((err) => {
                            return;
                        });

                        // delete mother of student
                        await db.query(conn, query_delete_mother, [ids[0].mother_id]).catch((err) => {
                            return;
                        });

                        // delete guardian of student
                        await db.query(conn, query_delete_guardian, [ids[0].guardian_id]).catch((err) => {
                            return;
                        });
                    }

                    // if affectedRows is less then 0 then the delete has failed so we need to rollback the changes
                    if (data.affectedRows < 0) {
                        conn.rollback(() => {
                            conn.release();
                        });
                        resolve(data.affectedRows);
                    } else {
                        // commit the changes
                        conn.commit((err) => {
                            // if a error occurs rollback the changes.
                            if (err) {
                                conn.rollback(() => {
                                    conn.release();
                                });
                                reject(err);
                            } else {
                                conn.release();
                                resolve(data.affectedRows);
                            }
                        });
                    }
                }
            });
        });
    }).catch((err) => {
        return -1;
    });

    return res.json({ success: affectedRows > 0 });
});

/**
 * Gets all students from the database.
 */
router.get('/', async function (req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.json({ "success": false, "message": "Access denied!" }).status(401);
    }

    let query = `
                SELECT student_email, student_first_name, student_middle_name, student_last_name
                student_phone_number, student_grade, student_status, student_city, student_school,
                f.father_first_name, f.father_last_name, f.father_phone_number, f.father_email, 
                f.father_education, f.father_place_birth, f.father_employer, f.father_job_title, 
                m.mother_first_name, m.mother_last_name, m.mother_phone_number, m.mother_email, 
                m.mother_education, m.mother_place_birth, m.mother_employer, m.mother_job_title, 
                g.guardian_name, g.guardian_email, g.guardian_phone_number
                FROM Student s
                LEFT JOIN Father f on s.father_id = f.father_id 
                LEFT JOIN Mother m on s.mother_id = m.mother_id
                LEFT JOIN Guardian g on s.guardian_id = g.guardian_id
    `;

    data = await db.query(db.pool, query).catch((err) => {
        return null;
    });

    let decrypted_data = [];
    for (var i in data) {
        decrypted_data.push(await decrypt_dict(data[i]));
    }

    return res.json(decrypted_data);
});

router.get("/get-emails", async function (req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.json({ "success": false, "message": "Access denied!" }).status(401);
    }

    if (!req.query) {
        return res.json({ "success": false, "message": "Invalid request" })
    }

    let query = "SELECT student_email FROM Student WHERE";
    let values = [];
    let firstFilter = true;

    // filters by grade
    if (req.query["grade"]) {
        query += " student_grade = ?";
        firstFilter *= false;
        values.push(await crypt.encrypt(req.query["grade"], KEY));
    }

    // filters by current/former status
    if (req.query["status"]) {
        if (firstFilter) {
            firstFilter *= false;
        } else {
            query += " AND";
        }

        query += " student_status = ?";
        values.push(await crypt.encrypt(req.query["status"], KEY))
    }

    // filters by school
    if (req.query['school']) {
        if (firstFilter) {
            firstFilter *= false;
        } else {
            query += " AND"
        }

        query += " student_school = ?";
        values.push(await crypt.encrypt(req.query['school'], KEY));
    }

    // filters by city
    if (req.query['city']) {
        if (firstFilter) {
            firstFilter *= false;
        } else {
            query += " AND"
        }

        query += " student_city = ?";
        values.push(await crypt.encrypt(req.query['city'], KEY));
    }

    let data = null;
    // if first filter is still true, then get all emails since no filters have been applied.
    if (firstFilter) {
        query = "SELECT student_email FROM Student;"
        data = await db.query(db.pool, query).catch((err) => {
            return [];
        });
    } else {
        data = await db.query(db.pool, query, values).catch((err) => {
            return [];
        });
    }

    // decrypt all the emails so that messages can be sent to them.
    let decrypted_data = [];
    for (var i in data) {
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
async function encrypt_dict(dict) {
    let encrypted_dict = {};

    for (var key in dict) {
        if (typeof (typeof (dict[key]) !== null) && typeof (dict[key]) === 'object') {
            encrypted_dict[key] = {};
            for (var key2 in dict[key]) {
                encrypted_dict[key][key2] = await crypt.encrypt(crypt.arrayToBuffer(dict[key][key2]), KEY);
            }
        } else {
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
async function decrypt_dict(dict) {
    let decrypted_dict = {};

    for (var key in dict) {
        if (!Buffer.isBuffer(dict[key]) && dict[key] != null) {
            decrypted_dict[key] = {};
            for (var key2 in dict[key]) {
                if (dict[key] != null) {
                    decrypted_dict[key][key2] = (await crypt.decrypt(dict[key][key2], KEY)).toString('utf-8');
                } else {
                    decrypted_dict[key][key2] = null;
                }
            }
        } else {
            if (dict[key] != null) {
                decrypted_dict[key] = (await crypt.decrypt(dict[key], KEY)).toString('utf-8');
            } else {
                decrypted_dict[key] = null;
            }
        }
    }

    return decrypted_dict;
}

module.exports = router;