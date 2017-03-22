# CS 5150 Navigation in Library Stacks: API | Ruby

MIT

## Usage

### Test on local computer

- Install Ruby 2.4 and Rails 5.0, [rvm](https://rvm.io/) recommended.
- Clone this repo
- Set up a local MySQL (MariaDB) installation with user/pw: root/password
- ```cd proj_dir```, ```bundle```, ```rake db:migrate```
- ```cd proj_dir```, ```rails server```
- Install Postman (Chrome extension)
- Import ```swagger.yaml``` from this repo
- All entry points callable from Postman client

### Remote API access

The API is currently live [here](https://boiling-woodland-25300.herokuapp.com/v1/).

- Install Postman (Chrome extension)
- Import ```muggles-waffles.postman_collection.json``` from this repo
- All entry points callable from Postman client

Standalone API documentation will be online soon. For now, refer to [Swagger Docs](https://powerful-shore-47112.herokuapp.com/docs).