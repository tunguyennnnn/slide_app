class CreateImageBlocks < ActiveRecord::Migration
  def change
    create_table :image_blocks do |t|
      t.string :image_blockable_type
      t.string :image_blockable_id
      t.string :image_url
      t.string :block_css
      t.timestamps null: false
    end
  end
end
