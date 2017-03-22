# CS 5150 Navigation in Library Stacks | Ruby

MIT

## Usage

### Test on local computer

- Install Ruby 2.4 and Rails 5.0, [rvm](https://rvm.io/) recommended.
- Clone this repo
- Set up a local MySQL (MariaDB) installation with user/pw: root/password
- ```cd proj_dir```, ```bundle```, ```rake db:create```, ```rake db:migrate```
- ```cd proj_dir```, ```rails server```
- Install Postman (Chrome extension)
- Import ```swagger.yaml``` from this repo
- All entry points callable from Postman client

### Remote API access

The API is currently live [here](https://boiling-woodland-25300.herokuapp.com/v1/).

- Install Postman (Chrome extension)
- Import ```muggles-waffles.postman_collection.json``` from this repo
- All entry points callable from Postman client

Standalone API documentation is available [here](https://boiling-woodland-25300.herokuapp.com/docs/v1).

### Stack Map

A prototype of stack map is available [here](https://boiling-woodland-25300.herokuapp.com/maps?callno=&library_id=).

You can test with the following query:

`callno`: ```"QA76.73.P98 B439 2013"```
`library_id`: ```4```
