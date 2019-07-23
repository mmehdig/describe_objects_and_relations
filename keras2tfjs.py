import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'
import tensorflow as tf
import tensorflowjs as tfjs

lm_dir = 'language_model/'
lm_top_dir = 'language_model_top/'
#filename = 'keras_models/caption_model_bbox-r_0sch_5e_80bs.h5'
filename = 'keras_models/caption_model_bbox-r_2sch_2e_320bs.h5'
model = tf.keras.models.load_model(filename, compile=False)

inputs = model.inputs

embs = model.layers[10](inputs[3])
_, vfg = model.layers[14].input

#xout = [embs, vfg, inputs]
fusion_out = tf.keras.layers.Concatenate(2)([
    embs,
    tf.keras.layers.RepeatVector(17)(vfg)
])
lstm1 = model.layers[17]
lstm2 = model.layers[24]
h0 = lstm1(fusion_out)
h1 = lstm2(h0)
_, sf, vfs = model.layers[20].input
#xout = [h0, sf, vfs]

# beta
sf_ = tf.keras.layers.RepeatVector(17)(sf)
print(sf_)
sf_ = tf.keras.layers.Reshape([17, 1, 200], name="rs0")(sf_)
print(sf_)
#K.expand_dims(K.repeat_elements(K.expand_dims(sf, 1), max_len+1, 1), 2)
# [sent, 1, unit_size]

vf0_ = tf.keras.layers.Permute([2,1,3])(tf.keras.layers.TimeDistributed(tf.keras.layers.RepeatVector(17), name="td0")(vfs))
print(vf0_)
#K.repeat_elements(K.expand_dims(vf0, 1), max_len+1, 1)
# [sent, 49, unit_size] or [sent, 2, unit_size]

vf_sf = tf.keras.layers.Concatenate(2)([sf_,vf0_])
print(vf_sf)
# [sent, 49+1, unit_size] or [sent, 2+1, unit_size]

h_ = tf.keras.layers.TimeDistributed(tf.keras.layers.RepeatVector(3), name="td1")(h0)
print(h_)
#h_ = K.repeat_elements(K.expand_dims(h, 2), beta_size-1, 2)
# [sent, 49+1, unit_size] or or [sent, 2+1, unit_size]
beta_features_out = tf.keras.layers.Concatenate(3)([h_, vf_sf])
print(beta_features_out)
beta_features_out = tf.keras.layers.Reshape([17, 3*2*200], name="rs1")(beta_features_out)
print(beta_features_out)

# att
att = model.layers[21](beta_features_out)
att = model.layers[22](att)
att = model.layers[23](att)
att = model.layers[25](att)
print(att)
#xout = att

h1_ = tf.keras.layers.Reshape([17,1,200], name="rs2")(h1)
c = tf.keras.layers.Concatenate(2)([h1_, vf_sf])
print(c)

#c = tf.keras.layers.Dot(2)([att, c])
#print(c)

#out = model.layers[-1](c)

xout = [att, c]

modelx = tf.keras.models.Model(inputs, xout)
#modelx = tf.keras.models.Model(inputs, c)
tfjs.converters.save_keras_model(modelx, lm_dir)

inp = tf.keras.layers.Input([17, 200])
modelxtop = tf.keras.models.Model(inp, model.layers[-1](inp))
tfjs.converters.save_keras_model(modelxtop, lm_top_dir)
