class CreateTextBlocks < ActiveRecord::Migration
  def change
    create_table :text_blocks do |t|
      t.integer :slide_id
      t.string :text_block_css
      t.string :html_content
      t.timestamps null: false
    end
  end
end
