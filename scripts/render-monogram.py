import bpy,math,sys,os
from pathlib import Path
output=Path(os.environ.get("MK_RENDER_OUTPUT", "mk-renders")).resolve()
output.mkdir(parents=True,exist_ok=True)
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=160;scene.cycles.use_denoising=False;scene.cycles.max_bounces=6
scene.render.resolution_x=1100;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.world.color=(.035,.04,.05)
scene.view_settings.view_transform='AgX'
scene.render.image_settings.color_mode='RGBA'
def mat(name,color,metal=0,rough=.3):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
metal=mat('Satin platinum',(.32,.39,.49),1,.17)
black=mat('Obsidian floor',(.008,.011,.018),.2,.28)
font=bpy.data.fonts.load(str(Path(__file__).resolve().parent.parent/'assets/fonts/studio-sans-bold.otf'))
curve=bpy.data.curves.new('MK sculpted logotype','FONT');curve.body='mk';curve.font=font;curve.align_x='CENTER';curve.size=3.8;curve.space_character=.91;curve.extrude=.23;curve.bevel_depth=.045;curve.bevel_resolution=6;curve.resolution_u=24
obj=bpy.data.objects.new('MK',curve);bpy.context.collection.objects.link(obj);obj.rotation_euler=(math.pi/2,0,0);obj.location=(0,0,.15);obj.data.materials.append(metal)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0));bpy.context.object.data.materials.append(black)
def area(name,loc,power,color,size,target=(0,0,1.5),rect=None):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='RECTANGLE' if rect else 'DISK';d.size=size
 if rect:d.size_y=rect
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Softbox',(-2,-5,7),2000,(.94,.97,1),5)
area('Left strip',(-5,-1,3),1600,(1,1,1),1,rect=6)
area('Right ice rim',(5,1,3.5),2100,(.25,.5,1),1,rect=5)
area('White reflection',(0,2,7),2400,(1,1,1),4)
area('Front fill',(1,-5,2),350,(.6,.75,1),3)
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.lens=58
cam.location=(3.0,-10,4.0);target=Vector((0,0,1.4));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
# Original views used by the Canvas viewer. No WebGL dependency at runtime.
scene.cycles.samples=128
scene.render.resolution_x=960;scene.render.resolution_y=560
bpy.ops.wm.save_as_mainfile(filepath=str(output/'monogram.blend'))
radius=math.hypot(3,10)
for i in range(9):
 a=math.atan2(3,10)+math.radians((i-4)*3.2)
 cam.location=(math.sin(a)*radius,-math.cos(a)*radius,4)
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(output/f'mk-{i:02d}.png')
 bpy.ops.render.render(write_still=True)
