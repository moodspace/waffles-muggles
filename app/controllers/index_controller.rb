# waffles-muggles
#
# CS 5150 Navigation in Library Stacks.
#
# Controller to render index
#
class IndexController < ApplicationController
    layout "materialize"

    def index
        render 'index/full'
    end
end
