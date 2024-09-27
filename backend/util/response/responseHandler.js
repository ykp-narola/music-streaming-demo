/**
 * responseHandler.js
 * @description :: exports all handlers for response format.
 */
const responseBody = require('./index');
const responseCode = require('./responseCode');
/**
 *
 * @param {obj} req : request from controller.
 * @param {obj} res : response from controller.
 * @param {*} next : executes the middleware succeeding the current middleware.
 */

// req.headers['developer_mode']  is used to view live data 
const responseHandler = (req, res, next) => {
  res.success = (data = {}) => {
    res.status(responseCode.success)
    .json(responseBody.success(data));
  };
  res.failure = (data = {}) => {
    res.status(responseCode.success)
    .json(responseBody.failure(data));
  };
  res.internalServerError = (data = {}) => {
    res.status(responseCode.internalServerError)
    .json(responseBody.internalServerError(data));
  };
  res.badRequest = (data = {}) => {
    res.status(responseCode.badRequest)
    .json(responseBody.badRequest(data));
  };
  res.recordNotFound = (data = {}) => {
    res.status(responseCode.success).json(responseBody.recordNotFound(data));
  };
  res.validationError = (data = {}) => {
    res.status(responseCode.validationError)
    .json(responseBody.validationError(data));
  };
  res.unAuthorized = (data = {}) => {
    res.status(responseCode.unAuthorized)
    .json(responseBody.unAuthorized(data));
  };

  res.tooManyRequests = (data = {}) => {
    res.status(responseCode.TooManyRequests)
    .json(responseBody.tooManyRequests(data));
  };

  res.check = (data = {}) => {
    res.status(responseCode.success)
    .json(responseBody.success(data));
  };
  next();
};

module.exports = responseHandler;
