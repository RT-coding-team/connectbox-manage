const express = require('express'),
    router = express.Router()
    configs = require('../configs.js'),
    fs = require('fs'),
    Logger = require('../logger.js'),
    logger = new Logger(configs.logging),
    functions = require('../functions.js');



router.get('/do/:command', function doCommand(req,res) {
	var data = {code:0,result: [functions.doCommand[req.params.command]()]};
	logger.log('debug', `${req.method} ${req.originalUrl}: ${data.result[0]}`);
	if (data.result[0].status) {
		res.status(data.result[0].status).send(data.result[0].message);
	}
	else {
		res.send(data);
	}
});

router.get('/brand/:key', function get(req, res) {
	var data = {code:0,result: [functions.getBrand(req.params.key)]};
	logger.log('debug', `${req.method} ${req.originalUrl}: ${data.result[0]}`);
	res.send(data);
});

router.get('/logs/:log', function get(req, res) {
	var data = {code:0,result: [functions.getLogs(req.params.log)]};
	logger.log('debug', `${req.method} ${req.originalUrl}: ${data.result[0]}`);
	res.send(data);
});

/**
 * Routes for LMS
 */
router.get('/lms/courses/:id(\\d+)/users', async function get(req, res) {
  const result = await functions.get['lms_courses_roster'](req.params.id);
  const data = {code:0,result: result};
  res.send(data);
});
router.get('/lms/courses/:id(\\d+)/classes', async function get(req, res) {
  const result = await functions.get['lms_courses_classes_roster'](req.params.id);
  const data = {code:0,result: result};
  res.send(data);
});
router.put('/lms/courses/:id(\\d+)/classes/:classid(\\d+)', async function enroll(req, res) {
  const result = await functions.put['lms_enroll_class'](req.params.id, req.params.classid, req.body);
  const data = {code:0,result: result};
  res.send(data);
});
router.delete('/lms/courses/:id(\\d+)/classes/:classid(\\d+)', async function unenroll(req, res) {
  const result = await functions.del['lms_unenroll_class'](req.params.id, req.params.classid);
  const data = {code:0,result: result};
  res.send(data);
});
router.put('/lms/courses/:id(\\d+)/users/:userid(\\d+)', async function enroll(req, res) {
  const result = await functions.put['lms_enroll_user'](req.params.id, req.params.userid, req.body);
  const data = {code:0,result: result};
  res.send(data);
});
router.delete('/lms/courses/:id(\\d+)/users/:userid(\\d+)', async function unenroll(req, res) {
  const result = await functions.del['lms_unenroll_user'](req.params.id, req.params.userid);
  const data = {code:0,result: result};
  res.send(data);
});
router.get('/lms/classes/:id(\\d+)/users', async function get(req, res) {
  const result = await functions.get['lms_classes_roster'](req.params.id);
  const data = {code:0,result: result};
  res.send(data);
});
router.put('/lms/classes/:id(\\d+)/users/:userid(\\d+)', async function enroll(req, res) {
  const result = await functions.put['lms_enroll_class_user'](req.params.id, req.params.userid, req.body);
  const data = {code:0,result: result};
  res.send(data);
});
router.delete('/lms/classes/:id(\\d+)/users/:userid(\\d+)', async function unenroll(req, res) {
  const result = await functions.del['lms_unenroll_class_user'](req.params.id, req.params.userid);
  const data = {code:0,result: result};
  res.send(data);
});
router.get('/lms/:key/:id(\\d+)', async function get(req, res) {
  if (!('lms_'+req.params.key in functions.get)) {
    res.sendStatus(404);
    return;
  }
  const result = await functions.get['lms_'+req.params.key](req.params.id);
  const data = {code:0,result: result};
  res.send(data);
});
router.get('/lms/:key', async function get(req, res) {
  if (!('lms_'+req.params.key in functions.get)) {
    res.sendStatus(404);
    return;
  }
  const result = await functions.get['lms_'+req.params.key]();
  const data = {code:0,result: result};
  res.send(data);
});
router.post('/lms/:key', async function post(req, res) {
  if (!('lms_'+req.params.key in functions.post)) {
    res.sendStatus(404);
    return;
  }
  const result = await functions.post['lms_'+req.params.key](req.body);
  const data = {code:0,result: result};
  res.send(data);
});
router.put('/lms/:key/:id(\\d+)', async function put(req, res) {
  if (!('lms_'+req.params.key in functions.put)) {
    res.sendStatus(404);
    return;
  }
  const payload = req.body;
  payload['id'] = req.params.id;
  const result = await functions.put['lms_'+req.params.key](payload);
  const data = {code:0,result: result};
  res.send(data);
});
router.delete('/lms/:key/:id(\\d+)', async function del(req, res) {
  if (!('lms_'+req.params.key in functions.del)) {
    res.sendStatus(404);
    return;
  }
  const result = await functions.del['lms_'+req.params.key](req.params.id);
  const data = {code:0,result: result};
  res.send(data);
});

router.get('/:key', function get(req, res) {
	var data = {code:0,result: [functions.get[req.params.key]()]};
	logger.log('debug', `${req.method} ${req.originalUrl}: ${data.result[0]}`);
	res.send(data);
});

router.put('/brand', function set(req,res) {
	var data = {code:0,result: [functions.setBrand(req.body)]};
	logger.log('debug', `${req.method} ${req.originalUrl}: ${JSON.stringify(data.result[0])}`);
	if (data.result[0].status) {
		res.status(data.result[0].status).send(data.result[0].message);
	}
	else {
		res.send(data);
	}
});

router.put('/:key', function set(req,res) {
	var data = {code:0,result: [functions.set[req.params.key](req.body)]};
	logger.log('debug', `${req.method} ${req.originalUrl}: ${JSON.stringify(data.result[0])}`);
	if (data.result[0].status) {
		res.status(data.result[0].status).send(data.result[0].message);
	}
	else {
		res.send(data);
	}
});

module.exports = router;
