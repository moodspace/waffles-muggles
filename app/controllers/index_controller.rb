#
# app/controllers/index_controller.rb
#
# Controller to render index
#
# Copyright (c) 2017 Ke Qian
#

class IndexController < ApplicationController
  layout 'bootstrap'

  def index
    render 'index/full'
  end
end
