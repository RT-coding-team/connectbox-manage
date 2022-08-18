const axios = require('axios').default;
const fs = require('fs');
const brand = JSON.parse(fs.readFileSync('/usr/local/connectbox/brand.txt'));
const {execSync} = require("child_process");
/**
 * Our LMS object that handles interaction with the LMS.  This script currently supports
 * Moodle's API.
 *
 * @type {Object}
 */
const lms = {};
lms.url = `http://learn.${brand.Brand}/webservice/rest/server.php`;
try {
	if (fs.existsSync('/var/www/moodle')) {
		lms.token = execSync("sudo -u postgres psql moodle -qtAX -c 'select token from mdl_external_tokens where externalserviceid = 2;'").toString().replace('\n','');
	}
	else {
		lms.token='';
	}
}
catch (err) {
	lms.token='';
}
/**
 * Do we have everything to make a request?
 *
 * @return {boolean}  yes|no
 */
lms.can_make_request = () =>  {
  return ((lms.token !== '') && (lms.url !== ''));
};
/**
 * Get a list of classes (cohorts in Moodle)
 *
 * @return {Promise} The JSON response
 */
lms.get_classes = async (id) => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  const ids = [];
  if (id) {
    ids.append(id);
  }
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_get_cohorts',
    'moodlewsrestformat': 'json',
    'cohortids': ids,
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Get a list of members in the class (cohort)
 *
 * @param  {integer}    id  The id of the course
 * @return {Promise}        The JSON response
 */
lms.get_class_roster = async (id) => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_get_cohort_members',
    'moodlewsrestformat': 'json',
    'cohortids': [id],
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Create a new class in the LMS (cohort in Moodle)
 *
 * @param  {object}  data The JSON object of data for the new class
 * @return {Promise}      The JSON response
 */
lms.post_class = async (data) => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if ((!('name' in data)) || (data.name === '')) {
    return 'You must supply a valid class name!';
  }
  const slug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_create_cohorts',
    'moodlewsrestformat': 'json',
    'cohorts[0][categorytype][type]': 'system',
    'cohorts[0][categorytype][value]': '',
    'cohorts[0][idnumber]': slug,
    'cohorts[0][name]': data.name,
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Update a class in the LMS (cohort in Moodle)
 *
 * @param  {integer} id   The id of the class (cohort) to update
 * @param  {object}  data The JSON object of data for the updated class
 * @return {Promise}      The JSON response
 */
lms.put_class = async (id, data) => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }
  const slug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_update_cohorts',
    'moodlewsrestformat': 'json',
    'cohorts[0][id]': id,
    'cohorts[0][categorytype][type]': 'system',
    'cohorts[0][categorytype][value]': '',
    'cohorts[0][name]': data.name,
    'cohorts[0][idnumber]': slug,
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The class has been updated.';
  }
  return response.data;
};
/**
 * Delete a given class (cohort)
 *
 * @param  {integer}  id  The id of the class (cohort) to delete.
 * @return {Promise}      The JSON response
 */
lms.delete_class = async (id)  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_delete_cohorts',
    'moodlewsrestformat': 'json',
    'cohortids': [id],
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The class has been deleted.';
  }
  return response.data;
};
/**
 * Enroll a user into a class (cohort)
 *
 * @param  {integer}    classid The id of the class to enroll into
 * @param  {integer}    userid  The id of the user to enroll
 * @return {Promise}            A message of whether successful or the data
 */
lms.put_enroll_class_user = async (classid, userid) => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!classid) {
    return 'You must supply a vaild class id!';
  }
  if (!userid) {
    return 'You must supply a vaild user id!';
  }
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_add_cohort_members',
    'moodlewsrestformat': 'json',
    'members[0][cohorttype][type]': 'id',
    'members[0][cohorttype][value]': classid,
    'members[0][usertype][type]': 'id',
    'members[0][usertype][value]': userid,
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (response.data.warnings.length == 0) {
    return 'The user has been enrolled in the class.';
  }
  return response.data;
};
/**
 * Remove a user from a class (cohort)
 *
 * @param  {integer}    classid The id of the class to remove from
 * @param  {integer}    userid  The id of the user to remove
 * @return {Promise}            A message of whether successful or the data
 */
lms.del_unenroll_class_user = async (classid, userid) => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!classid) {
    return 'You must supply a vaild class id!';
  }
  if (!userid) {
    return 'You must supply a vaild user id!';
  }
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_cohort_delete_cohort_members',
    'moodlewsrestformat': 'json',
    'members[0][cohortid]': classid,
    'members[0][userid]': userid,
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The user has been unenrolled in the class.';
  }
  return response.data;
};
/**
 * Get a list of courses
 *
 * @return {Promise} The JSON response
 */
lms.get_courses = async () => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_course_get_courses',
    'moodlewsrestformat': 'json'
  };
  const response = await axios.post(lms.url, null, {params: params});
  // Remove the initial course that is all of Moodle's users
  return response.data.filter((course) => course.id !== 1);
};
/**
 * Get a specific course
 *
 * @param  {integer}  id  The id of the course
 * @return {Promise}      The JSON response
 */
lms.get_course = async (id) =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_course_get_courses_by_field',
    'moodlewsrestformat': 'json',
    'field': 'id',
    'value': id,
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Delete the requested course
 *
 * @param  {integer}  id  The id of the course
 * @return {Promise}      The JSON response
 */
lms.delete_course = async (id)  => {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_course_delete_courses',
    'moodlewsrestformat': 'json',
    'courseids[0]': id,
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (response.data.warnings.length == 0) {
    return 'The course has been deleted.';
  }
  return response.data;
};
/**
 * Update the given course
 *
 * @param  {integer}    id      The id of the course to update
 * @param  {object}     data    The data with update info
 * @return {Promise}            The JSON response
 */
lms.put_course = async (id, data) => {
  const whitelist = [
    'fullname', 'shortname', 'categoryid', 'summary', 'summaryformat', 'format',
    'showgrades', 'newsitems', 'startdate', 'enddate', 'maxbytes', 'showreports',
    'visible', 'groupmode', 'groupmodeforce', 'defaultgroupingid', 'enablecompletion',
    'completionnotify', 'lang', 'forcetheme'
  ];
  if (!lms.can_make_request()) {
     return 'You need to set the url and token!';
   }
   if (!id) {
     return 'You must provide a valid id.';
   }
   const params = {
     'wstoken': lms.token,
     'wsfunction': 'core_course_update_courses',
     'moodlewsrestformat': 'json',
     'courses[0][id]': id,
   };
   whitelist.filter((field) => (field in data)).forEach((field) => params['courses[0]['+field+']'] = data[field]);
   const response = await axios.post(lms.url, null, {params: params});
   if (response.data.warnings.length == 0) {
     return 'The course has been updated.';
   }
   return response.data;
};
/**
 * Get a list of students enrolled in a course
 *
 * @param  {integer}  id  The id for the course
 * @return {Promise}      The JSON response
 */
lms.get_course_roster = async (id)  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_enrol_get_enrolled_users',
    'moodlewsrestformat': 'json',
    'courseid': id,
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Get a list of classes enrolled in a course
 * NOTE: Requires this Moodle plugin:
 * @link https://moodle.org/plugins/local_ws_enrolcohort
 *
 * @param  {integer}  id  The id for the course
 * @return {Promise}      The JSON response
 */
lms.get_course_class_roster = async (id)  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'local_ws_enrolcohort_get_instances',
    'moodlewsrestformat': 'json',
    'course[id]': id,
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Enroll the class into a course.
 * NOTE: Requires this Moodle plugin:
 * @link https://moodle.org/plugins/local_ws_enrolcohort
 *
 * @param  {integer}    courseid    The course id to enroll into
 * @param  {integer}    classid     The cohort (class) id
 * @param  {object}     data        The JSON data that stores a roleid if it exists.
 *
 * @return {Promise}                The response
 */
lms.enroll_course_roster_class = async (courseid, classid, data) => {
    let roleid = 5;
    if (!lms.can_make_request()) {
      return 'You need to set the url and token!';
    }
    if (!courseid) {
      return 'You must supply a vaild course id!';
    }
    if (!classid) {
      return 'You must supply a vaild class id!';
    }
    if ((data)  && ('roleid' in data) && ([1, 3, 4, 5].includes(parseInt(data.roleid, 10)))) {
      roleid = parseInt(data.roleid, 10);
    }
    const params = {
      'wstoken': lms.token,
      'wsfunction': 'local_ws_enrolcohort_add_instance',
      'moodlewsrestformat': 'json',
      'instance[courseid]': courseid,
      'instance[cohortid]': classid,
      'instance[roleid]': roleid,
    };
    const response = await axios.post(lms.url, null, {params: params});
    if (response.data.message.includes('instance added')) {
      return 'The class has been enrolled in the course.';
    }
    return response.data;
};
/**
 * Unenroll a class (cohort) from a course
 * NOTE: Requires this Moodle plugin:
 * @link https://moodle.org/plugins/local_ws_enrolcohort
 *
 * @param  {integer}    courseid    The course id to enroll into
 * @param  {integer}    classid     The cohort (class) id
 *
 * @return {Promise}                    The response
 */
lms.unenroll_course_roster_class = async (courseid, classid) => {
    if (!lms.can_make_request()) {
      return 'You need to set the url and token!';
    }
    if (!courseid) {
      return 'You must supply a vaild course id!';
    }
    if (!classid) {
      return 'You must supply a vaild class id!';
    }
    const roster = await lms.get_course_class_roster(courseid);
    const enrollment = roster.data.find((enrol) => enrol.cohortid === parseInt(classid, 10));
    if (typeof enrollment === 'undefined') {
        return 'Unable to find the enrollment for this class.';
    }
    const params = {
      'wstoken': lms.token,
      'wsfunction': 'local_ws_enrolcohort_delete_instance',
      'moodlewsrestformat': 'json',
      'instance[id]': enrollment.id,
    };
    const response = await axios.post(lms.url, null, {params: params});
    if (response.data.message.includes('instance deleted')) {
      return 'The class has been unenrolled in the course.';
    }
    return response.data;
};
/**
 * Enroll the user from the course. By default enrolls as a student.  Supply a roleid in
 * the data to change the role.
 *
 * @param  {integer}  courseid  The course id
 * @param  {integer}  userid    The user id
 * @param  {object}   data      The JSON data that stores a roleid if it exists.
 *
 * @return {Promise}  The response
 */
lms.enroll_course_roster_user = async (courseid, userid, data)  =>  {
  let roleid = 5;
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!courseid) {
    return 'You must supply a vaild course id!';
  }
  if (!userid) {
    return 'You must supply a vaild user id!';
  }
  if ((data)  && ('roleid' in data) && ([1, 3, 4, 5].includes(parseInt(data.roleid, 10)))) {
    roleid = parseInt(data.roleid, 10);
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'enrol_manual_enrol_users',
    'moodlewsrestformat': 'json',
    'enrolments[0][courseid]': courseid,
    'enrolments[0][userid]': userid,
    'enrolments[0][roleid]': roleid,
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The user has been enrolled in the course.';
  }
  return response.data;
};
/**
 * Unenroll the user from the course.
 *
 * @param  {integer}  courseid  The course id
 * @param  {integer}  userid    The user id
 * @return {Promise}  The response
 */
lms.unenroll_course_roster_user = async (courseid, userid)  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!courseid) {
    return 'You must supply a vaild course id!';
  }
  if (!userid) {
    return 'You must supply a vaild user id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'enrol_manual_unenrol_users',
    'moodlewsrestformat': 'json',
    'enrolments[0][courseid]': courseid,
    'enrolments[0][userid]': userid,
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The user has been unenrolled in the course.';
  }
  return response.data;
};
/**
 * Get all the users of the LMS.
 *
 * @return {Promise} The JSON response
 */
lms.get_users = async ()  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_user_get_users',
    'moodlewsrestformat': 'json',
    'criteria[0][key]': 'lastname',
    'criteria[0][value]': '%',
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Get the user based on the given id
 * @param  {integer}  id  The user id
 * @return {Promise}  The JSON response
 */
lms.get_user = async (id) =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_user_get_users_by_field',
    'moodlewsrestformat': 'json',
    'field': 'id',
    'values': [id],
  };
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Create a new user in the LMS
 *
 * @param  {object}  data The JSON object of data for the new user
 * @return {Promise}      The JSON response
 */
lms.post_user = async (data)  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if ((!('username' in data)) || (data.username === '')) {
    return 'You must supply a valid username!';
  }
  if ((!('firstname' in data)) || (data.firstname === '')) {
    return 'You must supply a valid firstname!';
  }
  if ((!('lastname' in data)) || (data.lastname === '')) {
    return 'You must supply a valid lastname!';
  }
  if ((!('email' in data)) || (data.email === '')) {
    return 'You must supply a valid email!';
  }
  if (
    ((!('password' in data)) || (data.password === '')) &&
    ((!('createpassword' in data)) || (data.createpassword !== 1))
  ) {
    return 'You must supply a valid password or createpassword!';
  }

  // Check provided data
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_user_create_users',
    'moodlewsrestformat': 'json',
    'users[0][username]': data.username,
    'users[0][firstname]': data.firstname,
    'users[0][lastname]': data.lastname,
    'users[0][email]': data.email,
  };
  if ('password' in data) {
    params['users[0][password]'] = data.password;
  } else if ('createpassword' in data) {
    params['users[0][createpassword]'] = 1;
  } else {
    return 'You must supply a valid password or createpassword!';
  }
  const optionals = [
    'maildisplay', 'city', 'country', 'timezone', 'description', 'middlename',
    'alternatename', 'url', 'icq', 'skype', 'aim', 'yahoo', 'msn', 'institution', 'department',
    'phone1', 'phone2', 'address', 'lang', 'mailformat', 'interests'
  ];
  optionals.filter((field) => (field in data)).forEach((field) => params['users[0]['+field+']'] = data[field]);
  const response = await axios.post(lms.url, null, {params: params});
  return response.data;
};
/**
 * Update the gven user
 *
 * @param  {integer}  id    The user's id
 * @param  {object}   data  The data to be updated
 * @return {Promise}        The JSON response
 */
lms.put_user = async (id, data) =>  {
  const whitelist = [
    'username', 'maildisplay', 'city', 'country', 'timezone', 'description', 'middlename',
    'alternatename', 'url', 'icq', 'skype', 'aim', 'yahoo', 'msn', 'institution', 'department',
    'phone1', 'phone2', 'address', 'lang', 'mailformat', 'suspended', 'password', 'firstname',
    'lastname', 'email', 'interests'
  ];
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must provide a valid id.';
  }
  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_user_update_users',
    'moodlewsrestformat': 'json',
    'users[0][id]': id,
  };
  whitelist.filter((field) => (field in data)).forEach((field) => params['users[0]['+field+']'] = data[field]);
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The user has been updated.';
  }
  return response.data;
};
/**
 * Delete a given user
 *
 * @param  {integer}  id  The id of the user to delete.
 * @return {Promise}      The JSON response
 */
lms.delete_user = async (id)  =>  {
  if (!lms.can_make_request()) {
    return 'You need to set the url and token!';
  }
  if (!id) {
    return 'You must supply a vaild id!';
  }

  const params = {
    'wstoken': lms.token,
    'wsfunction': 'core_user_delete_users',
    'moodlewsrestformat': 'json',
    'userids': [id],
  };
  const response = await axios.post(lms.url, null, {params: params});
  if (!response.data) {
    return 'The user has been deleted.';
  }
  return response.data;
};

module.exports = lms;
