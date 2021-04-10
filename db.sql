CREATE TABLE User(
    user_id INT NOT NULL AUTO_INCREMENT,
    user_email VARBINARY(412),
    user_password VARBINARY(156),

    PRIMARY KEY(user_id)
);

CREATE TABLE Adminstrator(
    admin_id INT NOT NULL AUTO_INCREMENT,
    admin_email VARBINARY(412),

    PRIMARY KEY(admin_id)
);

CREATE TABLE Father(
    father_id INT NOT NULL AUTO_INCREMENT,
    father_first_name VARBINARY(92),
    father_last_name VARBINARY(92),
    father_phone_number VARBINARY(38),
    father_email VARBINARY(412),
    father_education VARBINARY(156),
    father_place_birth VARBINARY(283),
    father_employer VARBINARY(283),
    father_job_title VARBINARY(283),

    PRIMARY KEY(father_id)
);

CREATE TABLE Mother(
    mother_id INT NOT NULL AUTO_INCREMENT,
    mother_first_name VARBINARY(92),
    mother_last_name VARBINARY(92),
    mother_phone_number VARBINARY(38),
    mother_email VARBINARY(412),
    mother_education VARBINARY(156),
    mother_place_birth VARBINARY(283),
    mother_employer VARBINARY(283),
    mother_job_title VARBINARY(283),

    PRIMARY KEY(mother_id)
);

CREATE TABLE Guardian(
    guardian_id INT NOT NULL AUTO_INCREMENT,
    guardian_name VARBINARY(156),
    guardian_email VARBINARY(412),
    guardian_phone_number VARBINARY(38),

    PRIMARY KEY(guardian_id)
);

CREATE TABLE Student(
    student_id INT NOT NULL AUTO_INCREMENT,
    student_email VARBINARY(412),
    student_first_name VARBINARY(92),
    student_middle_name VARBINARY(92),
    student_last_name VARBINARY(92),
    student_phone_number VARBINARY(38),
    father_id INT,
    mother_id INT,
    guardian_id INT,
    student_grade VARBINARY(30),
    student_status VARBINARY(92),
    student_city VARBINARY(92),

    PRIMARY KEY(student_id),
    CONSTRAINT unique_student UNIQUE (student_email, student_first_name, student_last_name),
    CONSTRAINT father_id_fk FOREIGN KEY(father_id) REFERENCES Father (father_id),
    CONSTRAINT mother_id_fk FOREIGN KEY(mother_id) REFERENCES Mother (mother_id),
    CONSTRAINT guardian_id_fk FOREIGN KEY(guardian_id) REFERENCES Guardian (guardian_id)
);