# CS 5150 Navigation in Library Stacks | Ruby

MIT

## Usage

### Test on local computer (Unix / Linux)

- Install Ruby 2.4 and Rails 5.0, [rvm](https://rvm.io/) recommended
- Install Node 6.10.1 (comes with npm)
- Clone this repo
- Set up a local MySQL (MariaDB) installation with user/pw: root/password
- `cd proj_dir`, `bundle`, `rake db:create`, `rake db:migrate`
- `npm i` installs Babel for assets transpiling
- `rails server` starts the server, running at [localhost](http://127.0.0.1:8000/)

### Remote API access

The API is currently live [here](https://boiling-woodland-25300.herokuapp.com/v2/).

- Install Postman (Chrome extension)
- Read the [docs](https://boiling-woodland-25300.herokuapp.com/docs/) for supported methods
- All entry points callable from Postman client
- You may need to send a CSRF token along with some requests, [read more](http://guides.rubyonrails.org/security.html#csrf-countermeasures)
