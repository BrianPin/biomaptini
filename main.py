import jinja2
import os
import webapp2
from google.appengine.api import users
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template


class MainPage(webapp2.RequestHandler):
	def get(self):
		user = users.get_current_user()
		if user:
			greeting = ("Welcome, %s! (<a href=\"%s\">sign out</a>)" %
						(user.nickname(), users.create_logout_url("/")))
		else:
			greeting = "Welcome stranger"

		jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.dirname(__file__)))
		template_val = {
			'greetings' : greeting,
		}
		html_template = jinja_env.get_template('index.html')
		self.response.out.write(html_template.render(template_val))

class LoginPage(webapp2.RequestHandler):
	def get(self):
		jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.dirname(__file__)))
		html_template = jinja_env.get_template('login.html')
		self.response.out.write(html_template.render())


def main():
	application = webapp2.WSGIApplication(
										[
											('/login.html', LoginPage),
											('/', MainPage),
										], debug=True)

	run_wsgi_app(application)

if __name__ == "__main__":
	main()
