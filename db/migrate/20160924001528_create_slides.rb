class CreateSlides < ActiveRecord::Migration
  def change
    create_table :slides do |t|
      t.integer :position
      t.integer :project_id
      t.string :slide_css 
      t.timestamps null: false
    end
  end
end
