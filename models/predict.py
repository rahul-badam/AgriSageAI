import joblib
import pandas as pd
import numpy as np
import shap

def get_recommendation(user_crop, user_district):
    print("\n🔮 LOADING AGRISAGE BRAIN...")
    
    # 1. LOAD THE SAVED MODELS
    try:
        brain = joblib.load('agrisage_brain.pkl')
        print("✅ Models loaded successfully!")
        
        # Check if the requested crop matches the trained model
        # (Since we only trained ONE model in the demo, we must check this)
        trained_crop = brain.get('demo_crop', 'Unknown')
        trained_district = brain.get('demo_district', 'Unknown')
        
        if user_crop.lower() != trained_crop.lower():
            print(f"\n⚠️ WARNING: This model was trained on '{trained_crop}', but you asked for '{user_crop}'.")
            print(f"👉 For this demo, we will proceed using the '{trained_crop}' logic as a proxy.")
            # In a real app, you would load f"model_{user_crop}.pkl" here.
            
    except FileNotFoundError:
        print("❌ Error: 'agrisage_brain.pkl' not found. Run train_save.py first.")
        return

    # Extract components
    price_model = brain['price_model']
    yield_model = brain['yield_model']
    volatility = brain['volatility']
    last_date = brain['last_date']

    # ==========================================
    # 2. MAKE PREDICTIONS
    # ==========================================
    
    # A. Predict Price (Next 90 Days)
    print(f"\n📊 Forecasting Prices for {user_crop} in {user_district}...")
    
    # Create future dates starting from the last known date
    future = pd.DataFrame({'ds': pd.date_range(start=last_date, periods=90 + 1, freq='D')[1:]})
    
    try:
        forecast = price_model.predict(future)
        avg_price = forecast['yhat1'].mean()
    except Exception as e:
        print(f"⚠️ Forecasting fallback active (Error: {e})")
        avg_price = 4200.00 

    # B. Predict Yield (Based on User Input)
    print("🌱 Analyzing Soil Conditions...")
    
    # Ask user for soil details (Optional - strictly for demo)
    # n_val = float(input("   Enter Soil Nitrogen (N): ") or 120)
    n_val = 120 # Defaulting for speed
    
    user_soil = pd.DataFrame([[n_val, 55, 650, 6.2]], 
                             columns=['Nitrogen', 'Phosphorous', 'Rainfall', 'pH'])
    
    predicted_yield = yield_model.predict(user_soil)[0]

    # ==========================================
    # 3. RUN RISK ENGINE
    # ==========================================
    print("🎲 Running Risk Simulation...")
    ITERATIONS = 10000
    sim_prices = np.random.normal(avg_price, avg_price * volatility, ITERATIONS)
    sim_yields = np.random.normal(predicted_yield, predicted_yield * 0.1, ITERATIONS)
    revenue = sim_prices * sim_yields
    
    expected_rev = np.mean(revenue)
    worst_case = np.percentile(revenue, 5)
    risk_score = (np.std(revenue) / expected_rev) * 100

    # ==========================================
    # 4. FINAL REPORT
    # ==========================================
    print("\n" + "="*50)
    print(f"🌾 RECOMMENDATION FOR: {user_crop.upper()} ({user_district})")
    print("="*50)
    print(f"💰 Forecasted Price:  ₹{avg_price:.2f} / Quintal")
    print(f"🚜 Predicted Yield:   {predicted_yield:.2f} Quintals/acre")
    print("-" * 50)
    print(f"💵 Expected Profit:   ₹{expected_rev:,.2f} / acre")
    print(f"🛡️ Worst Case (Risk): ₹{worst_case:,.2f} / acre")
    print(f"⚠️ Risk Score:        {risk_score:.1f} / 100")
    
    if risk_score < 20:
        print("✅ STATUS: SAFE BET (Low Risk)")
    elif risk_score < 40:
        print("🟠 STATUS: MODERATE RISK")
    else:
        print("🔴 STATUS: HIGH RISK (Insurance Recommended)")

if __name__ == "__main__":
    # --- THIS IS WHERE YOU INPUT CROP & DISTRICT ---
    print("\n--- AGRISAGE AI TERMINAL ---")
    c_input = input("Enter Crop Name (e.g., Maize): ").strip()
    d_input = input("Enter District (e.g., Warangal Urban): ").strip()
    
    if not c_input: c_input = "Maize" # Default
    if not d_input: d_input = "Warangal Urban" # Default

    get_recommendation(c_input, d_input)