# waffles-muggles
#
# CS 5150 Navigation in Library Stacks.
#
# OpenAPI spec version: 1.0.0
#
# Generated by: https://github.com/swagger-api/swagger-codegen.git
#
class StacksController < ApplicationController
  include ApplicationControllerConcern

  def index
    ret = []
    Stack.find_each do |stack|
      ret << getStack(stack) if stack.floor == params[:floor_id].to_i
    end
    render json: ret
  end

  def destroy
    Stack.find(params[:id]).destroy
    render json: 'OK'.to_json
  end

  def show
    render json: getStackById(params[:id])
  end

  def create
    stack = Stack.new
    stack.cx = params[:cx]
    stack.cy = params[:cy]
    stack.lx = params[:lx]
    stack.ly = params[:ly]
    stack.rotation = params[:rotation]
    stack.start_class = params[:startClass]
    stack.start_subclass = params[:startSubclass]
    stack.start_subclass2 = params[:startSubclass2]
    stack.end_class = params[:endClass]
    stack.end_subclass = params[:endSubclass]
    stack.end_subclass2 = params[:endSubclass2]
    stack.oversize = params[:oversize]
    stack.floor = params[:floor]
    if stack.save
      render json: stack.id.to_json
    else
      render json: {error: 'bad request', code: 400, message: 'unable to create record'}, status: 400
    end
  end

  def stacks_put
    stack = Stack.find(params[:id])
    stack.cx = params[:cx] || stack.cx
    stack.cy = params[:cy] || stack.cy
    stack.lx = params[:lx] || stack.lx
    stack.ly = params[:ly] || stack.ly
    stack.rotation = params[:rotation] || stack.rotation
    stack.start_class = params[:startClass] || stack.start_class
    stack.start_subclass = params[:startSubclass] || stack.start_subclass
    stack.start_subclass2 = params[:startSubclass2] || stack.start_subclass2
    stack.end_class = params[:endClass] || stack.end_class
    stack.end_subclass = params[:endSubclass] || stack.end_subclass
    stack.end_subclass2 = params[:endSubclass2] || stack.end_subclass2
    stack.oversize = params[:oversize] || stack.oversize
    stack.floor = params[:floor] || stack.floor
    if stack.save
      render json: 'OK'.to_json
    else
      render json: {error: 'bad request', code: 400, message: 'unable to update record'}, status: 400
    end
  end
end
