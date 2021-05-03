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

CREATE TABLE Student(
    student_id INT NOT NULL AUTO_INCREMENT,
    student_first_name VARBINARY(92) NOT NULL,
    student_middle_name VARBINARY(92),
    student_last_name VARBINARY(92) NOT NULL,    
    student_status VARCHAR(32),
    student_age TINYINT,
    student_dob DATE,
    student_ethnic_group VARCHAR(64),
    student_gender VARCHAR(32),
    student_foster VARCHAR(32),
    student_siblings_count TINYINT,
    student_lives_with VARCHAR(64), 
    student_family_income VARCHAR(64),
    student_place_of_work VARCHAR(64),
    student_approx_work_hours TINYINT,
    student_experienced_health_issue VARCHAR(32),
    student_takes_medication VARCHAR(32),

    PRIMARY KEY(student_id)
);

CREATE TABLE Student_School_Info(
    school_info_id INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    student_grade TINYINT,
    student_school VARCHAR(255),
    student_GPA FLOAT(4,3),
    student_discount_lunch VARCHAR(32),

    PRIMARY KEY(school_info_id),
    FOREIGN KEY(student_id) REFERENCES Student (student_id) ON DELETE CASCADE
);

CREATE TABLE Student_Contact_Info(
    contact_id INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    student_email VARBINARY(412) NOT NULL,
    student_phone_number VARBINARY(39),
    student_best_contact_number VARBINARY(39) NOT NULL,

    PRIMARY KEY(contact_id),
    FOREIGN KEY(student_id) REFERENCES Student (student_id) ON DELETE CASCADE
);

CREATE TABLE Father(
    father_id INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    father_first_name VARBINARY(92) NOT NULL,
    father_last_name VARBINARY(92) NOT NULL,
    father_phone_number VARBINARY(39),
    father_email VARBINARY(412),
    father_education VARCHAR(128),
    father_place_birth VARBINARY(283),
    father_employer VARBINARY(283),
    father_job_title VARBINARY(283),

    PRIMARY KEY(father_id),
    FOREIGN KEY(student_id) REFERENCES Student (student_id) ON DELETE CASCADE
);

CREATE TABLE Mother(
    mother_id INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    mother_first_name VARBINARY(92) NOT NULL,
    mother_last_name VARBINARY(92) NOT NULL,
    mother_phone_number VARBINARY(39),
    mother_email VARBINARY(412),
    mother_education VARCHAR(128),
    mother_place_birth VARBINARY(283),
    mother_employer VARBINARY(283),
    mother_job_title VARBINARY(283),

    PRIMARY KEY(mother_id),
    FOREIGN KEY(student_id) REFERENCES Student (student_id) ON DELETE CASCADE
);

CREATE TABLE Guardian(
    guardian_id INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    guardian_name VARBINARY(156) NOT NULL,
    guardian_email VARBINARY(412),
    guardian_phone_number VARBINARY(38),

    PRIMARY KEY(guardian_id),
    FOREIGN KEY(student_id) REFERENCES Student (student_id) ON DELETE CASCADE
);

CREATE TABLE Student_Address(
    address_id INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    address_street VARBINARY(283) NOT NULL,
    address_city VARBINARY(92) NOT NULL,
    address_state VARBINARY(92) NOT NULL,
    address_zip VARBINARY(38),

    PRIMARY KEY(address_id),
    FOREIGN KEY(student_id) REFERENCES Student (student_id) ON DELETE CASCADE
);