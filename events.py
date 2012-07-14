import datamodel
import webapp2
import logging
import myjson
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import users
from google.appengine.ext import db

# Locations that user has clicked, stores the lat/lng
place_cache = []

class UpdateHandler(webapp2.RequestHandler):
	''' When application starts, the FE needs to fetch places data
	'''
	def get(self):
		user = users.get_current_user()
		if user == None:
			return

		logging.info("/event/update begin")
		query = db.GqlQuery("SELECT * FROM Place WHERE user = :1", user)
		mark_place = query.fetch(100)
		self.response.headers['Content-Type'] = "application/json"
		self.response.out.write(myjson.encode(mark_place))
		logging.info(myjson.encode(mark_place))
		logging.info("/event/update end")
		for place in mark_place:
			place.delete()


class CreateHandler(webapp2.RequestHandler):

	"""Handles marker creation events.

	CreateHandler only provides a post method for receiving user marker
	click events. This data is immediately dumped to datastore.
	Without batching and appended to the local cache.
	"""

	def post(self):
		global place_cache

		# Will not save data for user not logged-in
		user = users.get_current_user()
		if user == None:
			return

		place = datamodel.Place()
		logging.info("/event/setplace begin")
		place.user = user
		place.latitude = float(self.request.get('latitude'))
		place.longitude = float(self.request.get('longitude'))
		place.zoom = int(self.request.get('zoom'))
		logging.info("%f", place.latitude)
		logging.info("%f", place.longitude)
		#logging.info(self.request)
		place.put()
		logging.info("/event/setplace end")
		# append it to a cache, so we dont need to wait for a refresh
		# place_cahce.append(place)

class DeleteHandler(webapp2.RequestHandler):

	def post(self):
		""" Select entities from datastore, based on the parameters passed from the client
		"""
		user = users.get_current_user()
		if user == None:
			return
		logging.info("delete place begin")
		lat = float(self.request.get('latitude'))
		lng = float(self.request.get('longitude'))
		zoom = int(self.request.get('zoom'))
		query = db.GqlQuery("SELECT * FROM Place " +
							"WHERE latitude = :1 AND longitude = :2 AND user = :3", lat, lng, user)
		results = query.fetch(5)
		for ans in results:
			logging.info("%f %f %d %s", ans.latitude, ans.longitude, ans.zoom, ans.user)

		for ans in results:
			ans.delete()
		logging.info("delete place end")

def main():

	"""Main method called when the script is executed directly

	This method is called each time the script is launched,
	so it has effects of enabling caching for global variables
	"""

	application = webapp2.WSGIApplication(
		[
			('/event/setplace', CreateHandler),
			('/event/update', UpdateHandler),
			('/event/deleteplace', DeleteHandler),
		],
		debug = True)
	run_wsgi_app(application)

if __name__ == '__main__':
	main()
