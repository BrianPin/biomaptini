
import json
from google.appengine.ext import db
from google.appengine.api import users


class ObjEncoder(json.JSONEncoder):

	def default(self, obj):
		
		if isinstance(obj, db.Model):
			properties = obj.properties().items()
			output = {}
			for field, value in properties:
				output[field] = getattr(obj, field)
			return output

		elif isinstance(obj, users.User):
			output = {}
			methods = ['nickname', 'email', 'auth_domain']
			for method in methods:
				output[method] = getattr(obj, method)()
			return output

		return json.JSONEncoder.default(self, obj)


def encode(obj):
	return ObjEncoder().encode(obj)
