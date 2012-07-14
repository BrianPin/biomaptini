from google.appengine.ext import db
from google.appengine.api import users

class Place(db.Model):
	latitude = db.FloatProperty()
	longitude = db.FloatProperty()
	user = db.UserProperty()
	zoom = db.IntegerProperty()

