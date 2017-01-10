class CreateCodeBlocks < ActiveRecord::Migration
  def change
    create_table :code_blocks do |t|
      t.integer :slide_id
      t.string :block_css
      t.string :html_content
      t.timestamps null: false
    end
  end
end
