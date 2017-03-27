class AddFk < ActiveRecord::Migration[5.0]
    def change
        add_foreign_key :stacks, :floors, column: :floor
        add_foreign_key :floors, :libraries, column: :library
        add_index :floors, [:library, :name]
    end
end
