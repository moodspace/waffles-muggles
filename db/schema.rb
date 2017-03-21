# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 0) do

  create_table "errors", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "code"
    t.string "message"
    t.string "fields"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "floors", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "id"
    t.string "name"
    t.decimal "size_x", precision: 10
    t.decimal "size_y", precision: 10
    t.string "geojson"
    t.integer "library"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "libraries", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "id"
    t.string "name"
    t.decimal "latitude", precision: 10
    t.decimal "longitude", precision: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "rules", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "rule_type"
    t.integer "rule_id"
    t.string "call_number"
    t.string "rule"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "search_results", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.string "result_type"
    t.integer "result_id"
    t.string "result"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "stacks", id: false, force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci" do |t|
    t.integer "id"
    t.decimal "cx", precision: 10
    t.decimal "cy", precision: 10
    t.decimal "lx", precision: 10
    t.decimal "ly", precision: 10
    t.decimal "rotation", precision: 10
    t.string "geojson"
    t.string "start_class"
    t.integer "start_subclass"
    t.string "end_class"
    t.integer "end_subclass"
    t.integer "oversize"
    t.integer "floor"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
