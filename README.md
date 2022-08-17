# connectbox-manage
This project replaces the 2018 Bash script ConnectBoxManage.sh in connectbox-pi and the chat API to simplify the chat delievery through eliminating SQL and using node's ability to retain state during operation.

This is a node.js javascript application leveraging a common library of management functions for the Connectbox based platforms.  These functions are available through an API and through a command-line interface (CLI).

* The application is written in nodejs and runs in the pm2 process handler for nodejs applications.  The API is available on port 5002.
* The CLI is written in python and converts command line arguments into API calls hitting the localhost:5002 API.  This was done due to performance issues with the nodejs CLI on low capability CPUs.

# Installation and Development
Connectbox-pi Ansible will install this application but should you want to install on another machine or for development:
* git clone the repo to your machine.
* Install nodejs 14+ and npm for your type of machine
* Navigate to the repo's home directory and run `npm install` to install the node packages in packages.json
* In the src directory, run `node index.js` to start the API web application -- runs on port 5002
* In the src direction, run `node cli` for usage and examples

# Chat
The application allows PUT to chat and GET from chat:
* PUT `/chat`: Example Call: `{"body": "Hi", "nick": "VogelKohen42", "textDirection": "ltr"}` will return a 200 or 500 if invalid
* GET `/chat/:lastMessage` replace `:lastMessage` with timestamp (UNIX epoch time without milliseconds) of last retrieved message to get just the latest messages.  Example Call: `/chat/1645451503`
* API cleans up messages more than 3 hours old.  If application is restarted (see pm2 details below), chat cache is cleared.

# Developing Additional Functions
The API and the CLI will execute new commands found in the functions.js file.  Each function should be formatted according to existing functions and have the following characteristics:
* Have a header line for self-documenting usage:
  `//DICT:SET:clientssid (string): Client Wi-Fi SSID`
  - DICT indicates the line is self-documenting description
  - GET/SET/DO indicates the type of function
  - clientssid is the name of the function
  - (string) indicates the type of input expected
  - Lastly a text description

* A new function should start with `get.` `set.` or `doCommand.` as shown in functions.js
```
//DICT:GET:clientssid: Client Wi-Fi SSID
get.clientssid = function (){
	return (execute(`grep 'ssid' /etc/wpa_supplicant/wpa_supplicant.conf | cut -d'"' -f2`))
}
```

# Deployment Options
* By default the [connectbox-pi repo](https://github.com/ConnectBox/connectbox-pi/blob/master/ansible/roles/enhanced-content/tasks/main.yml) installs these tools in /var/www/enhanced/connectbox-manage and uses [pm2](https://pm2.keymetrics.io/) to serve as process manager.  Helpful commands are: `pm2 status` `pm2 restart all` `pm2 logs`
* Execute as a nodejs application as shown in the [Installation and Deployment](#installation-and-development) section above.
* A nodejs docker could be used to run the application.

# Create A Moodle API Token

The connectbox repo default Moodle database has these defaults and creates a token at build time.  

This is the process for performing this manually:

Log into Moodle with an administration account.  First, we need to create a custom API service:

- Visit Site administration > Plugins > Web services > External services
- Click Add under Custom Services
    - Name: Connectbox API
    - Short Name: connectbox_api
    - Click Add Service
- Click Add functions
    - Add the following functions:
        - core_cohort_create_cohorts
        - core_cohort_delete_cohort_members
        - core_cohort_get_cohorts
        - core_cohort_get_cohort_members
        - core_cohort_update_cohorts
        - core_cohort_delete_cohorts
        - core_cohort_add_cohort_members
        - core_user_get_users
        - core_user_get_users_by_field
        - core_user_create_users
        - core_user_delete_users
        - core_user_update_users
        - core_course_get_courses_by_field
        - core_course_get_courses
        - core_course_update_courses
        - core_course_delete_courses
        - core_enrol_get_enrolled_users
        - enrol_manual_enrol_users
        - enrol_manual_unenrol_users
    - Click Add functions

Now we need to generate the token.

- Visit Site administration > Plugins > Web services > Manage tokens
- Click Add at the bottom
    - Select Admin User from User
    - Select Connectbox API from Service
    - Click Save Changes

Lastly, add the token to functions.js.

NOTE: To unenroll and enroll user, the course must have manual enrollment enabled. [This page](https://docs.moodle.org/400/en/Manual_enrolment) explains how to set up manual enrollment.

If you want to use the Cohort enrollment/unenrollment features, you must follow these steps:

- Install [this local plugin](https://moodle.org/plugins/local_ws_enrolcohort)
- Add the following functions to Connectbox API service:
    - local_ws_enrolcohort_add_instance
    - local_ws_enrolcohort_delete_instance
    - local_ws_enrolcohort_get_instances
- Enable Cohort Sync by visiting Site administration > Plugins > Enrolments > Manage enrol plugins.
