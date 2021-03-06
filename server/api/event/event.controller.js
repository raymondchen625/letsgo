/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/events              ->  index
 * POST    /api/events              ->  create
 * GET     /api/events/:id          ->  show
 * PUT     /api/events/:id          ->  upsert
 * PATCH   /api/events/:id          ->  patch
 * DELETE  /api/events/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Event from './event.model';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      // eslint-disable-next-line prefer-reflect
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of events
export function index(req, res) {
  return Event.find()
    .populate({ path: 'host', select: ['_id', 'name', 'imageUrl'] })
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Event from the DB
export function show(req, res) {
  return Event.findById(req.params.id)
    .populate({ path: 'host', select: ['_id', 'name', 'imageUrl'] })
    .populate({ path: 'participants.user', select: ['_id', 'name', 'imageUrl'] })
    .exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Event in the DB
export function create(req, res) {
  return Event.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Event in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }
  return Event.findOneAndUpdate({_id: req.params.id}, req.body, {new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Event in the DB
export function patch(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Event from the DB
export function destroy(req, res) {
  return Event.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

// Search Events from the DB by text
export function search(req, res) {
  return Event.find({ name: { $regex: new RegExp(req.params.text, 'i') } })
    .populate({ path: 'host', select: ['_id', 'name', 'imageUrl'] })
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Hosting events from the DB
export function hosting(req, res) {
  return Event.find({ host: req.params.host })
    .populate({ path: 'host', select: ['_id', 'name', 'imageUrl'] })
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Going events from the DB
export function going(req, res) {
  return Event.find({ 'participants.user': req.params.participant })
    .populate({ path: 'host', select: ['_id', 'name', 'imageUrl'] })
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Favorite events from the DB
export function favorite(req, res) {
  return Event.find({ favoritesBy: req.params.user })
    .populate({ path: 'host', select: ['_id', 'name', 'imageUrl'] })
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

