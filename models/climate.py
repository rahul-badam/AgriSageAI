import numpy as np


def climate_risk_engine(
    base_price: float,
    base_yield: float,
    rainfall: float,
    price_volatility: float = 0.15,
    yield_volatility: float = 0.10,
    iterations: int = 10000
):
    """
    Climate & Risk Engine

    Simulates:
    - Baseline Monte Carlo revenue
    - Rainfall drop scenario
    - Price crash scenario
    - Combined shock
    - Climate Volatility Index (CVI)

    Returns structured dictionary output.
    """

    # ==============================
    # 1️⃣ Baseline Monte Carlo
    # ==============================
    price_sim = np.random.normal(
        base_price,
        base_price * price_volatility,
        iterations
    )

    yield_sim = np.random.normal(
        base_yield,
        base_yield * yield_volatility,
        iterations
    )

    revenue_sim = price_sim * yield_sim

    expected_revenue = float(revenue_sim.mean())
    worst_case_revenue = float(np.percentile(revenue_sim, 5))
    std_dev = float(revenue_sim.std())

    cvi = float((std_dev / expected_revenue) * 100)

    # ==============================
    # 2️⃣ Rainfall Drop (-30%)
    # ==============================
    drought_yield = float(base_yield * 0.8)
    drought_revenue = float(base_price * drought_yield)

    # ==============================
    # 3️⃣ Price Crash (-25%)
    # ==============================
    crash_price = float(base_price * 0.75)
    crash_revenue = float(crash_price * base_yield)

    # ==============================
    # 4️⃣ Combined Shock
    # ==============================
    combined_price = float(base_price * 0.75)
    combined_yield = float(base_yield * 0.75)
    combined_revenue = float(combined_price * combined_yield)

    # ==============================
    # 5️⃣ Risk Label
    # ==============================
    if cvi < 15:
        risk_level = "Low Risk"
    elif cvi < 30:
        risk_level = "Moderate Risk"
    elif cvi < 50:
        risk_level = "High Risk"
    else:
        risk_level = "Extreme Risk"

    # ==============================
    # Final Output
    # ==============================
    results = {
        "baseline": {
            "expected_revenue": round(expected_revenue, 2),
            "worst_case_revenue": round(worst_case_revenue, 2),
            "CVI": round(cvi, 2)
        },
        "rainfall_drop": {
            "adjusted_yield": round(drought_yield, 2),
            "expected_revenue": round(drought_revenue, 2)
        },
        "price_crash": {
            "adjusted_price": round(crash_price, 2),
            "expected_revenue": round(crash_revenue, 2)
        },
        "combined_shock": {
            "expected_revenue": round(combined_revenue, 2)
        },
        "risk_level": risk_level
    }

    return results


# ===================================
# RUN DIRECTLY FROM TERMINAL
# ===================================
if __name__ == "__main__":

    print("\n🌍 Running Climate & Risk Engine...\n")

    output = climate_risk_engine(
        base_price=3800,   # example price per quintal
        base_yield=32,     # quintals per acre
        rainfall=650       # rainfall (not yet used dynamically)
    )

    print("📊 OUTPUT:\n")
    print(output)
