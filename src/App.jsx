
import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [recipes, setRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const recipesSectionRef = useRef(null)
  const recipeDetailsRef = useRef(null)

  // Scroll to recipe cards after searching
useEffect(() => {
  if (hasSearched && !loading && recipes.length > 0) {
    recipesSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}, [hasSearched, loading, recipes])

// Scroll to recipe details after clicking View Recipe
useEffect(() => {
  if (selectedRecipe) {
    recipeDetailsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}, [selectedRecipe])

  async function handleSearch() {
    const ingredientList = ingredients
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    if (ingredientList.length === 0) {
      setError('Please enter at least one ingredient.')
      return
    }

    setLoading(true)
    setError('')
    setSelectedRecipe(null)
    setHasSearched(true)
    setRecipes([])

    try {
      const responses = await Promise.all(
        ingredientList.map((ingredient) =>
          fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
          )
        )
      )

      if (responses.some((response) => !response.ok)) {
        throw new Error('Unable to fetch recipes.')
      }

      const results = await Promise.all(
        responses.map((response) => response.json())
      )

      const recipeMap = new Map()

      results.forEach((result) => {
        ;(result.meals || []).forEach((meal) => {
          if (recipeMap.has(meal.idMeal)) {
            recipeMap.get(meal.idMeal).matchedCount += 1
          } else {
            recipeMap.set(meal.idMeal, {
              ...meal,
              matchedCount: 1,
            })
          }
        })
      })

      const matchedRecipes = Array.from(recipeMap.values()).sort(
        (a, b) => b.matchedCount - a.matchedCount
      )

      setRecipes(matchedRecipes)

      if (matchedRecipes.length === 0) {
        setError('No recipes found. Try different ingredients.')
      }
    } catch (error) {
      console.error(error)
      setError('Could not load recipes. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  async function viewRecipe(recipeId) {
    setError('')
    setDetailsLoading(true)
    setSelectedRecipe(null)

    try {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`
      )

      if (!response.ok) {
        throw new Error('Unable to load recipe details.')
      }

      const data = await response.json()
      const meal = data.meals?.[0]

      if (!meal) {
        throw new Error('Recipe details were not found.')
      }

      setSelectedRecipe(meal)
    } catch (error) {
      console.error('Recipe error:', error)
      setError('Could not load recipe details. Please try again.')
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">
          Dishcovery<span>.</span>
        </h2>
        <p>Discover delicious possibilities</p>
      </nav>

      <main className="hero">
        <p className="tagline">YOUR KITCHEN, YOUR ADVENTURE</p>

        <h1>
          What’s in your <span>kitchen?</span>
        </h1>

        <p className="description">
          Turn the ingredients you already have into something delicious.
        </p>

        <div className="search-box">
          <input
            type="text"
            placeholder="e.g. chicken, potato, onion..."
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
          />

          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Finding...' : 'Find Recipes'}
          </button>
        </div>

        <p className="hint">✨ Less waste, more taste.</p>

      <section className="recipes-section" ref={recipesSectionRef}>          <div className="recipes-heading">
            <p className="category-title">
              {hasSearched ? 'YOUR SEARCH RESULTS' : 'A LITTLE INSPIRATION'}
            </p>

            <h2>
              {hasSearched
                ? 'Recipes for your ingredients'
                : 'Something delicious awaits'}
            </h2>
          </div>

          {loading && <p>Finding delicious recipes for you...</p>}

          {error && <p className="no-results">{error}</p>}

          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <article className="recipe-card" key={recipe.idMeal}>
                <img src={recipe.strMealThumb} alt={recipe.strMeal} />

                <div className="recipe-info">
                  <span className="recipe-tag">🍽️ Recipe idea</span>
                  <h3>{recipe.strMeal}</h3>

                  <button
                    onClick={() => viewRecipe(recipe.idMeal)}
                    disabled={detailsLoading}
                  >
                    {detailsLoading ? 'Loading...' : 'View Recipe'}
                  </button>

                <div className="recipe-meta">
  <span>🍽️ Explore this recipe</span>
</div>
                </div>
              </article>
            ))}
          </div>

          {detailsLoading && (
            <p>Loading ingredients and cooking instructions...</p>
          )}

          {selectedRecipe && (
            <section className="recipe-details" ref={recipeDetailsRef}>
              <button onClick={() => setSelectedRecipe(null)}>
                ← Back to Recipes
              </button>

              <h2>{selectedRecipe.strMeal}</h2>

              <img
                src={selectedRecipe.strMealThumb}
                alt={selectedRecipe.strMeal}
                className="details-image"
              />

              <p>
                <strong>Cuisine:</strong>{' '}
                {selectedRecipe.strArea || 'Not specified'}
              </p>

              <p>
  <strong>Category:</strong>{' '}
  {selectedRecipe.strCategory || 'Not specified'}
</p>

              <h3>Ingredients and Measurements</h3>

              <ul>
                {Array.from({ length: 20 }, (_, index) => {
                  const ingredient = selectedRecipe[
                    `strIngredient${index + 1}`
                  ]?.trim()

                  const measure = selectedRecipe[
                    `strMeasure${index + 1}`
                  ]?.trim()

                  if (!ingredient) return null

                  return (
                    <li key={index}>
                      {ingredient}
                      {measure ? ` — ${measure}` : ''}
                    </li>
                  )
                })}
              </ul>

              <h3>Cooking Instructions</h3>

              <p className="instructions">
                {selectedRecipe.strInstructions ||
                  'Instructions are not available for this recipe.'}
              </p>

              {selectedRecipe.strSource && (
                <p>
                  <a
                    href={selectedRecipe.strSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Original Recipe
                  </a>
                </p>
              )}
            </section>
          )}
        </section>
      </main>

      <footer>Made with love for food lovers ❤️</footer>
    </div>
  )
}

export default App
