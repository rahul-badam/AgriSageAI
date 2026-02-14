import joblib
import pandas as pd
import numpy as np
import shap

model = joblib.load("crop_model.pkl")

input_data = pd.DataFrame([{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 28,
    "humidity": 80,
    "rainfall": 200,
    "ph": 6.5
}])

probs = model.predict_proba(input_data)[0]
classes = model.classes_

top_indices = np.argsort(probs)[::-1][:3]

print("Top 3 Crop Recommendations:\n")

for i in top_indices:
    crop = classes[i]
    confidence = probs[i] * 100
    print(f"{crop} — {confidence:.2f}%")


explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(input_data)


print("\nFeature Contribution for Top Crop:\n")

top_crop_index = top_indices[0]

feature_contributions = shap_values[top_crop_index][0]

for feature, value in zip(input_data.columns, feature_contributions):
    print(f"{feature}: {value:.4f}")

shap.initjs()
shap.force_plot(
    explainer.expected_value[top_crop_index],
    shap_values[top_crop_index][0],
    input_data
)
