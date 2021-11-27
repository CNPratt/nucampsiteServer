const express = require("express");
const authenticate = require("../authenticate");
const cors = require("./cors");
const Favorite = require("../models/favorite");
const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user")
      .populate("campsites")
      .then((favorite) => {
        if (favorite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        } else {
          err = new Error(`Favorites not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorites) => {
      if (favorites) {
        const idsToAdd = req.body.filter(
          (id) => !favorites.campsites.includes(id)
        );
        idsToAdd.forEach((id) => favorites.campsites.push(id));
        favorites
          .save()
          .then((favorites) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end(`Added campsite ids ${idsToAdd} to favorites`);
          })
          .catch((err) => next(err));
      } else {
        const newFavorite = new Favorite({
          user: req.user._id,
          campsites: req.body,
        });
        newFavorite
          .save()
          .then((favorites) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
          })
          .catch((err) => next(err));
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites`);
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id }).then((deletedFave) => {
      res.statusCode = 200;

      if (deletedFave) {
        res.setHeader("Content-Type", "application/json");
        res.json(deletedFave);
      } else {
        res.setHeader("Content-Type", "text/plain");
        res.send(`You do not have any favorites to delete.`);
      }
    });
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `GET operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorites) => {
      if (!favorites) {
        const newFavorite = new Favorite({
          user: req.user._id,
          campsites: req.body,
        });
        newFavorite
          .save()
          .then((favorites) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
          })
          .catch((err) => next(err));
      } else if (!favorites.campsites.includes(req.params.campsiteId)) {
        favorites.campsites.push(req.params.campsiteId);
        favorites
          .save()
          .then((favorites) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end(`Added campsite id: ${req.params.campsiteId}`);
          })
          .catch((err) => next(err));
      } else if (favorites.campsites.includes(req.params.campsiteId)) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("That campsite is already in the list of favorites!");
      } else {
        err = new Error("An error has occurred!");
        err.status = 403;
        return next(err);
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorites) => {
      if (favorites) {
        favorites.campsites.splice(
          favorites.campsites.indexOf(req.params.campsiteId),
          1
        );
        favorites
          .save()
          .then((favorites) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
          })
          .catch((err) => next(err));
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end(`No favorites to delete.`);
      }
    });
  });

module.exports = favoriteRouter;
