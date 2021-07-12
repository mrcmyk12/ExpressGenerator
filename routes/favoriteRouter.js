const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");
const { Error } = require("mongoose");

const favoriteRouter = express.Router();

favoriteRouter
	.route("/")
	.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		Favorite.find({ user: req.user._id })
			.populate("favorite.user")
			.populate("favorite.campsites")
			.then((favorites) => {
				res.statusCode = 200;
				res.setHeader("Content-Type", "application/json");
				res.json(favorites);
			})
			.catch((err) => next(err));
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id }).then((favorite) => {
			if (favorite) {
				favorite.campsites.forEach((campsite) => {
					if (req.body.includes(campsite)) {
						res.end("This campsite has already been favorited");
					} else {
						favorite.campsites.push(req.body).then((favorites) => {
							res.statusCode = 200;
							res.setHeader("Content-Type", "application/json");
							res.json(favorites);
						});
					}
				});
			} else {
				Favorite.create({ user: req.user._id })
					.then((favorite) => {
						favorite.campsites.push(req.body);
					})
					.then((response) => {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						res.json(response);
					});
			}
		});
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end("This operation is not supported");
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOneAndDelete({ user: req.user._id }).then((response) => {
			res.statusCode = 200;
			if (response) {
				res.setHeader("Content-Type", "application/json");
				res.json(response);
			} else {
				res.setHeader("Content-Type", "text.plain");
				res.end("You do not have any favorites to delete.");
			}
		});
	});

favoriteRouter
	.route("/:campsiteId")
	.options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
		res.sendStatus(200)
	)
	.get(cors.cors, (req, res) => {
		res.statusCode = 403;
		res.end("This operation is not supported");
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id }).then((favorites) => {
			if (favorites) {
				const index = favorites.campsite.indexOf(req.params.campsiteId);

				if (index === -1) {
					favorites.campsites.push(req.params.campsiteId);
					favorites.save().then((favorite) => {
						res.setHeader("Content-Type", "application/json");
						res.json(favorite);
					});
				} else {
					res.end("That campsite is already in the list of favorites");
				}
			} else {
				Favorite.create({ user: req.user._id }).then((favorite) => {
					favorite.campsites.push(req.params.campsiteId);
					favorite.save().then((favorite) => {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						res.json(favorite);
					});
				});
			}
		});
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end("This operation is not supported");
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id }).then((favorite) => {
			if (favorite) {
				const index = favorite.campsites.indexOf(req.params.campsiteId);

				favorite.campsites.splice(index);

				favorite.save().then((favorite) => {
					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json");
					res.json(favorite);
				});
			} else {
				res.setHeader("Content-Type", "text/plain");
				res.end("There are no favorites to delete.");
			}
		});
		res.statusCode = 200;
	});

module.exports = favoriteRouter;
